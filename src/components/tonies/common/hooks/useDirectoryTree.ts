import { useEffect, useState, useCallback } from "react";
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

    // lazy loading (TreeSelect.loadData)
    onLoadTreeData: (params: { id: string }) => Promise<void>;
}

export const useDirectoryTree = (): DirectoryTreeApi => {
    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<DirectoryTreeNode[]>([rootTreeNode]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    const getPathFromNodeId = useCallback(
        (nodeId: string): string => {
            const node = treeData.find((entry) => entry.value === nodeId || entry.id === nodeId);
            if (!node) return "";
            if (node.pId === "-1") return "";

            const parent = treeData.find((entry) => entry.id === node.pId);
            if (!parent) return `/${node.title}`;

            const parentPath = getPathFromNodeId(parent.id);
            return parentPath ? `${parentPath}/${node.title}` : `/${node.title}`;
        },
        [treeData]
    );

    const findNodeIdByFullPath = useCallback(
        (fullPath: string): string | null => {
            const normalized = fullPath.endsWith("/") ? fullPath : `${fullPath}/`;
            const node = treeData.find((n) => n.fullPath === normalized);
            return node ? node.id : null;
        },
        [treeData]
    );

    const findNodesByParentId = useCallback(
        (parentId: string): string[] => {
            return treeData.filter((n) => n.pId === parentId).map((n) => n.id);
        },
        [treeData]
    );

    const isNodeExpanded = useCallback((nodeId: string): boolean => expandedKeys.includes(nodeId), [expandedKeys]);

    useEffect(() => {
        const preLoadTreeData = async () => {
            const newPath = getPathFromNodeId(rootTreeNode.id); // i. d. R. ""

            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) =>
                            a.name.toLowerCase() > b.name.toLowerCase()
                                ? 1
                                : a.name.toLowerCase() < b.name.toLowerCase()
                                ? -1
                                : 0
                        )
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

                    setTreeData((prev) => prev.concat(list));
                });
        };
        preLoadTreeData();
    }, []);

    const onLoadTreeData = ({ id }: { id: string }) =>
        new Promise<void>((resolve, reject) => {
            const newPath = getPathFromNodeId(String(id));
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) =>
                            a.name.toLowerCase() > b.name.toLowerCase()
                                ? 1
                                : a.name.toLowerCase() < b.name.toLowerCase()
                                ? -1
                                : 0
                        )
                        .map((entry, index) => {
                            const stringId = String(id);
                            const value = `${stringId}.${index}`;
                            return {
                                id: value,
                                pId: stringId,
                                value,
                                title: entry.name,
                                fullPath: `${newPath}/${entry.name}/`,
                            } as DirectoryTreeNode;
                        });

                    setTreeData((prev) => prev.concat(list));
                    resolve();
                })
                .catch(reject);
        });

    const addDirectory = ({
        parentPath,
        directoryName,
        selectNewNode = false,
    }: {
        parentPath: string;
        directoryName: string;
        selectNewNode?: boolean;
    }) => {
        const parentFullPath = parentPath.endsWith("/") ? parentPath : `${parentPath}/`;

        const parentNodeId = findNodeIdByFullPath(parentFullPath) || rootTreeNode.id;

        const newNodeId = `${parentNodeId}.${treeData.length}`;

        const newDir: DirectoryTreeNode = {
            id: newNodeId,
            pId: parentNodeId,
            value: newNodeId,
            title: directoryName,
            fullPath: `${parentFullPath}${directoryName}/`,
        };

        setTreeData((prev) =>
            [...prev, newDir].sort((a, b) =>
                a.title.toLowerCase() > b.title.toLowerCase()
                    ? 1
                    : a.title.toLowerCase() < b.title.toLowerCase()
                    ? -1
                    : 0
            )
        );

        if (selectNewNode) {
            setTreeNodeId(newNodeId);
            setExpandedKeys((prev) => (prev.includes(parentNodeId) ? prev : [...prev, parentNodeId]));
        }
    };

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
        onLoadTreeData,
    };
};
