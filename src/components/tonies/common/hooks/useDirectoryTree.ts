import { useEffect, useState, useCallback, useRef } from "react";
import type { DefaultOptionType } from "antd/es/select";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export type DirectoryTreeNode = Omit<DefaultOptionType, "label"> & {
    id: string;
    pId: string;
    value: string;
    title: string;
    fullPath: string;
};

export const rootTreeNode: DirectoryTreeNode = {
    id: "1",
    pId: "-1",
    value: "1",
    title: "/",
    fullPath: "/",
};

export interface DirectoryTreeApi {
    // state
    treeData: DirectoryTreeNode[];
    setTreeData: React.Dispatch<React.SetStateAction<DirectoryTreeNode[]>>;
    treeNodeId: string;
    setTreeNodeId: (id: string) => void;
    expandedKeys: string[];
    setExpandedKeys: (keys: string[]) => void;

    rootTreeNode: DirectoryTreeNode;

    // queries
    getPathFromNodeId: (nodeId: string) => string;
    findNodeIdByFullPath: (fullPath: string) => string | null;
    findNodesByParentId: (parentId: string) => string[];
    isNodeExpanded: (nodeId: string) => boolean;

    // commands
    addDirectory: (params: { parentPath: string; directoryName: string; selectNewNode?: boolean }) => void;
    selectNodeByFullPath: (fullPath: string) => Promise<void>;

    // lazy loading (TreeSelect.loadData)
    onLoadTreeData: (params: { id: string }) => Promise<void>;
}

export const useDirectoryTree = (): DirectoryTreeApi => {
    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<DirectoryTreeNode[]>([rootTreeNode]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    // ---- refs to avoid "first open doesn't work" race (setState is async) ----
    const treeDataRef = useRef<DirectoryTreeNode[]>([rootTreeNode]);
    useEffect(() => {
        treeDataRef.current = treeData;
    }, [treeData]);

    const expandedKeysRef = useRef<string[]>([]);
    useEffect(() => {
        expandedKeysRef.current = expandedKeys;
    }, [expandedKeys]);

    // ---- helpers ----
    const normalizeFullPath = (p: string) => {
        let v = (p ?? "").toString().trim();
        if (!v) return "/";

        if (!v.startsWith("/")) v = `/${v}`;
        if (!v.endsWith("/")) v = `${v}/`;
        return v;
    };

    const findNodeIdByFullPath = useCallback((fullPath: string): string | null => {
        const normalized = normalizeFullPath(fullPath);
        const node = treeDataRef.current.find((n) => n.fullPath === normalized);
        return node ? node.id : null;
    }, []);

    const getPathFromNodeId = useCallback((nodeId: string): string => {
        const list = treeDataRef.current;

        const node = list.find((entry) => entry.value === nodeId || entry.id === nodeId);
        if (!node) return "";
        if (node.pId === "-1") return "";

        const parent = list.find((entry) => entry.id === node.pId);
        if (!parent) return `/${node.title}`;

        const parentPath = getPathFromNodeId(parent.id);
        return parentPath ? `${parentPath}/${node.title}` : `/${node.title}`;
    }, []);

    const findNodesByParentId = useCallback((parentId: string): string[] => {
        return treeDataRef.current.filter((n) => n.pId === parentId).map((n) => n.id);
    }, []);

    const isNodeExpanded = useCallback((nodeId: string): boolean => {
        return expandedKeysRef.current.includes(nodeId);
    }, []);

    const mergeTreeData = (prev: DirectoryTreeNode[], incoming: DirectoryTreeNode[]) => {
        const map = new Map<string, DirectoryTreeNode>();
        for (const n of prev) map.set(n.fullPath, n);
        for (const n of incoming) map.set(n.fullPath, n);
        return Array.from(map.values());
    };

    // ---- preload root children ----
    useEffect(() => {
        let cancelled = false;

        const preLoadTreeData = async () => {
            try {
                const newPath = getPathFromNodeId(rootTreeNode.id); // usually ""

                const response = await api.apiGetTeddyCloudApiRaw(
                    `/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`
                );
                const data = await response.json();

                let list: any[] = data.files;
                const mapped = list
                    .filter((entry) => entry.isDir && entry.name !== "..")
                    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                    .map((entry, index) => {
                        const id = `${rootTreeNode.id}.${index}`;
                        return {
                            id,
                            pId: rootTreeNode.id,
                            value: id,
                            title: entry.name,
                            fullPath: `${newPath}/${entry.name}/`,
                        } as DirectoryTreeNode;
                    });

                if (cancelled) return;

                setTreeData((prev) => {
                    const merged = mergeTreeData(prev, mapped);
                    treeDataRef.current = merged;
                    return merged;
                });
            } catch {
                // ignore preload errors
            }
        };

        void preLoadTreeData();
        return () => {
            cancelled = true;
        };
    }, [getPathFromNodeId]);

    // ---- lazy loading ----
    const onLoadTreeData = useCallback(
        ({ id }: { id: string }) => {
            return new Promise<void>(async (resolve, reject) => {
                try {
                    const parentId = String(id);

                    // compute path from current ref (works even before state commit)
                    const newPath = getPathFromNodeId(parentId);

                    const response = await api.apiGetTeddyCloudApiRaw(
                        `/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`
                    );
                    const data = await response.json();

                    let list: any[] = data.files;
                    const mapped = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                        .map((entry, index) => {
                            const value = `${parentId}.${index}`;
                            return {
                                id: value,
                                pId: parentId,
                                value,
                                title: entry.name,
                                fullPath: `${newPath}/${entry.name}/`,
                            } as DirectoryTreeNode;
                        });

                    setTreeData((prev) => {
                        const merged = mergeTreeData(prev, mapped);
                        // CRITICAL: update ref immediately so callers can find nodes right after await
                        treeDataRef.current = merged;
                        return merged;
                    });

                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        },
        [getPathFromNodeId]
    );

    // ---- commands ----
    const addDirectory = useCallback(
        ({
            parentPath,
            directoryName,
            selectNewNode = false,
        }: {
            parentPath: string;
            directoryName: string;
            selectNewNode?: boolean;
        }) => {
            const parentFullPath = normalizeFullPath(parentPath);
            const parentNodeId = findNodeIdByFullPath(parentFullPath) || rootTreeNode.id;

            const newNodeId = `${parentNodeId}.${treeDataRef.current.length}`;

            const newDir: DirectoryTreeNode = {
                id: newNodeId,
                pId: parentNodeId,
                value: newNodeId,
                title: directoryName,
                fullPath: `${parentFullPath}${directoryName}/`,
            };

            setTreeData((prev) => {
                const merged = mergeTreeData(prev, [newDir]).sort((a, b) =>
                    String(a.title).toLowerCase().localeCompare(String(b.title).toLowerCase())
                );
                treeDataRef.current = merged;
                return merged;
            });

            if (selectNewNode) {
                setTreeNodeId(newNodeId);
                setExpandedKeys((prev) => (prev.includes(parentNodeId) ? prev : [...prev, parentNodeId]));
            }
        },
        [findNodeIdByFullPath]
    );

    const selectNodeByFullPath = useCallback(
        async (fullPath: string) => {
            const target = normalizeFullPath(fullPath);

            if (target === "/") {
                setTreeNodeId(rootTreeNode.id);
                return;
            }

            const segments = target.split("/").filter(Boolean);

            let currentNodeId = rootTreeNode.id;
            let currentPath = "";

            for (const seg of segments) {
                currentPath = normalizeFullPath(currentPath);
                currentPath = `${currentPath}${seg}/`;

                await onLoadTreeData({ id: currentNodeId });

                const childId = findNodeIdByFullPath(currentPath);
                if (!childId) {
                    return;
                }
                setExpandedKeys((prev) => (prev.includes(currentNodeId) ? prev : [...prev, currentNodeId]));
                currentNodeId = childId;
            }

            setTreeNodeId(currentNodeId);
            setExpandedKeys((prev) => (prev.includes(currentNodeId) ? prev : [...prev, currentNodeId]));
        },
        [findNodeIdByFullPath, onLoadTreeData, rootTreeNode.id, normalizeFullPath]
    );

    return {
        treeData,
        setTreeData,
        treeNodeId,
        setTreeNodeId,
        expandedKeys,
        setExpandedKeys,
        rootTreeNode,
        getPathFromNodeId,
        findNodeIdByFullPath,
        findNodesByParentId,
        isNodeExpanded,
        addDirectory,
        selectNodeByFullPath,
        onLoadTreeData,
    };
};
