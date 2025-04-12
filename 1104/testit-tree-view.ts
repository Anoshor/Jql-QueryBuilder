import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { TestItProject } from './types';

interface TestItTreeViewProps {
  testItData: TestItProject[];
  selectedPaths: string[];
  onPathsChange: (paths: string[]) => void;
}

interface ProcessedNode {
  id: string;
  name: string;
  children?: ProcessedNode[];
  testCases?: number;
}

const TestItTreeView: React.FC<TestItTreeViewProps> = ({
  testItData,
  selectedPaths,
  onPathsChange
}) => {
  const [searchText, setSearchText] = useState('');
  const [processedData, setProcessedData] = useState<ProcessedNode[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);

  // Process the data into a format suitable for TreeView
  useEffect(() => {
    if (!testItData || testItData.length === 0) return;

    const processed: ProcessedNode[] = testItData.map(project => {
      return {
        id: project['Project ID'],
        name: project['Project Name'],
        children: processTestSuites(project['Test Suites'], project['Project ID'])
      };
    });

    setProcessedData(processed);
    
    // Auto-expand the first level
    setExpanded(processed.map(p => p.id));
  }, [testItData]);

  // Function to process test suites recursively
  const processTestSuites = (suiteWrappers: any[] = [], projectId: string, parentPath: string = ''): ProcessedNode[] => {
    if (!suiteWrappers || suiteWrappers.length === 0) return [];

    const result: ProcessedNode[] = [];

    suiteWrappers.forEach(wrapper => {
      // If wrapper is a suite itself
      if (wrapper.Suite_Id && wrapper['Suite Name']) {
        const currentPath = parentPath 
          ? `${parentPath}:${wrapper.Suite_Id}` 
          : `${projectId}:${wrapper.Suite_Id}`;
        
        const node: ProcessedNode = {
          id: currentPath,
          name: wrapper['Suite Name'],
          testCases: wrapper.Total_Test_Cases
        };

        // Check for children in both Child_Suites and Suites
        const childSuites1 = wrapper.Child_Suites || [];
        const childSuites2 = wrapper.Suites || [];
        const allChildren = [...childSuites1, ...childSuites2];

        if (allChildren.length > 0) {
          node.children = processTestSuites(allChildren, projectId, currentPath);
        }

        result.push(node);
      }
      // If wrapper has a Suites array
      else if (wrapper.Suites && wrapper.Suites.length > 0) {
        result.push(...processTestSuites(wrapper.Suites, projectId, parentPath));
      }
    });

    return result;
  };

  // Filter the processed data based on search text
  const filteredData = searchText
    ? processedData.filter(project => 
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        filterNodes(project.children || [], searchText.toLowerCase())
      )
    : processedData;

  // Helper function to recursively filter nodes
  const filterNodes = (nodes: ProcessedNode[], searchText: string): boolean => {
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(searchText)) {
        return true;
      }
      if (node.children && filterNodes(node.children, searchText)) {
        return true;
      }
    }
    return false;
  };

  // Handle expanding/collapsing nodes
  const handleToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  // Handle checking/unchecking nodes
  const handleSelect = (path: string) => {
    const isSelected = selectedPaths.includes(path);
    if (isSelected) {
      onPathsChange(selectedPaths.filter(p => p !== path));
    } else {
      onPathsChange([...selectedPaths, path]);
    }
  };

  // Recursively render tree nodes
  const renderTree = (nodes: ProcessedNode[] = []) => {
    return nodes.map(node => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
            <Checkbox
              checked={selectedPaths.includes(node.id)}
              onChange={() => handleSelect(node.id)}
              onClick={(e) => e.stopPropagation()}
              size="small"
            />
            <Typography variant="body2">
              {node.name}
              {node.testCases && node.testCases > 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({node.testCases} tests)
                </Typography>
              )}
            </Typography>
          </Box>
        }
      >
        {node.children && node.children.length > 0 && renderTree(node.children)}
      </TreeItem>
    ));
  };

  // Function to get a human-readable path name
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 2) return path;
    
    // Find each part in the processed data structure
    let result = '';
    let current = processedData;
    let currentNode: ProcessedNode | undefined;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Find the node with this ID at the current level
      currentNode = current.find(node => {
        if (i === 0) {
          return node.id === part;
        } else {
          return node.id.endsWith(part);
        }
      });
      
      if (currentNode) {
        result += (result ? ' > ' : '') + currentNode.name;
        current = currentNode.children || [];
      } else {
        result += (result ? ' > ' : '') + part;
        break;
      }
    }
    
    return result;
  };

  return (
    <Box>
      {/* Search Box */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search projects and suites..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchText && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchText('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Selected Paths */}
      {selectedPaths.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            Selected Paths ({selectedPaths.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPaths.map(path => (
              <Chip
                key={path}
                label={getPathName(path)}
                onDelete={() => handleSelect(path)}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Tree View */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {!filteredData || filteredData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0 
              ? 'Loading TestIt data...' 
              : 'No matching projects found'
            }
          </Typography>
        ) : (
          <TreeView
            aria-label="test-it-tree"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            expanded={expanded}
            onNodeToggle={handleToggle}
            sx={{ flexGrow: 1, overflowY: 'auto' }}
          >
            {renderTree(filteredData)}
          </TreeView>
        )}
      </Paper>
    </Box>
  );
};

export default TestItTreeView;
