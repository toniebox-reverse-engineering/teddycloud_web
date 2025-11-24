import React from "react";
import { TreeSelect } from "antd";
import type { TreeSelectProps } from "antd";
import type { DirectoryTreeApi } from "../hooks/useDirectoryTree";

interface Props {
    directoryTree: DirectoryTreeApi;
    disabled?: boolean;
    placeholder?: string;
}

export const DirectoryTreeSelect: React.FC<Props> = ({ directoryTree, disabled = false, placeholder }) => {
    const { treeData, treeNodeId, setTreeNodeId, expandedKeys, setExpandedKeys, onLoadTreeData } = directoryTree;

    const handleLoadTreeData: TreeSelectProps["loadData"] = ({ id }) => onLoadTreeData({ id: String(id) });

    return (
        <TreeSelect
            className="tree-select"
            treeLine
            treeDataSimpleMode
            value={treeNodeId}
            styles={{
                popup: {
                    root: {
                        maxHeight: 400,
                        overflow: "auto",
                    },
                },
            }}
            onChange={setTreeNodeId}
            loadData={handleLoadTreeData}
            treeData={treeData}
            treeNodeLabelProp="fullPath"
            placeholder={placeholder}
            treeExpandedKeys={expandedKeys}
            onTreeExpand={(keys) => setExpandedKeys(keys.map(String))}
            disabled={disabled}
        />
    );
};
