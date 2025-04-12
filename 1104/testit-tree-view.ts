import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { TestItProject } from './types';

interface TestItTreeViewProps {
  testItData: TestItProject[];
  selectedPaths: string[];
  onPathsChange: (paths: string[]) => void;
}

const TestItTreeView: React.FC<TestItTreeViewProps> = ({
  testItData,
  selectedPaths,
  onPathsChange
}) => {
  const [searchText, setSearchText] = useState('');
  const [treeItems, setTreeItems] = useState<TreeViewBaseItem[]>([]);
  
  // Transform the testItData into the format expected by RichTreeView
  useEffect(() => {
    if (!testItData || testItData.length === 0) return;
    
    const items: TreeViewBaseItem[] = testItData.map(project => ({
      id: project['Project ID'],
      label: project['Project Name'],
      children: processTestSuites(project['Test Suites'], project['Project ID'])
    }));
    
    setTreeItems(items);
  }, [testItData]);
  
  // Process test suites recursively to build the tree structure
  const processTestSuites = (suiteWrappers: any[] = [], projectId: string, parentPath: string = ''): TreeViewBaseItem[] => {
    if (!suiteWrappers || suiteWrappers.length === 0) return [];
    
    const result: TreeViewBaseItem[] = [];
    
    suiteWrappers.forEach(wrapper => {
      // If wrapper is a suite itself
      if (wrapper.Suite_Id && wrapper['Suite Name']) {
        const currentPath = parentPath 
          ? `${parentPath}:${wrapper.Suite_Id}` 
          : `${projectId}:${wrapper.Suite_Id}`;
        
        const node: TreeViewBaseItem = {
          id: currentPath,
          label: wrapper['Suite Name'] + (wrapper.Total_Test_Cases ? ` (${wrapper.Total_Test_Cases} tests)` : '')
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
  
  // Filter the tree items based on search text
  const filteredItems = searchText && treeItems.length > 0
    ? filterTreeItems(treeItems, searchText.toLowerCase())
    : treeItems;
  
  // Helper function to recursively filter tree items
  const filterTreeItems = (items: TreeViewBaseItem[], searchText: string): TreeViewBaseItem[] => {
    return items
      .map(item => {
        // Check if this item matches
        const matches = item.label.toLowerCase().includes(searchText);
        
        // Check if any children match
        let filteredChildren: TreeViewBaseItem[] = [];
        if (item.children && item.children.length > 0) {
          filteredChildren = filterTreeItems(item.children, searchText);
        }
        
        // Include this item if it matches or has matching children
        if (matches || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : item.children
          };
        }
        
        return null;
      })
      .filter((item): item is TreeViewBaseItem => item !== null);
  };
  
  // Convert the selected item IDs to readable names
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 2) return path;
    
    const projectId = parts[0];
    const project = testItData.find(p => p['Project ID'] === projectId);
    if (!project) return path;
    
    let result = project['Project Name'];
    
    // Helper function to find a suite by its path
    const findSuite = (path: string): string | null => {
      const allParts = path.split(':');
      if (allParts.length < 2) return null;
      
      let currentNode: TreeViewBaseItem | undefined;
      let currentItems = treeItems;
      
      // Find the project node
      currentNode = currentItems.find(item => item.id === allParts[0]);
      if (!currentNode || !currentNode.children) return null;
      
      currentItems = currentNode.children;
      
      // Navigate through the rest of the path
      for (let i = 1; i < allParts.length; i++) {
        const currentPath = allParts.slice(0, i + 1).join(':');
        currentNode = currentItems.find(item => item.id === currentPath);
        
        if (!currentNode) return null;
        
        // Remove any "(X tests)" suffix from the label
        const label = currentNode.label.replace(/\s*\(\d+\s*tests\)$/, '');
        
        if (currentPath === path) {
          return label;
        }
        
        if (!currentNode.children) return null;
        currentItems = currentNode.children;
      }
      
      return null;
    };
    
    // For each part, build the path
    let currentPath = projectId;
    for (let i = 1; i < parts.length; i++) {
      currentPath += `:${parts[i]}`;
      const suiteName = findSuite(currentPath);
      
      if (suiteName) {
        result += ` > ${suiteName}`;
      } else {
        result += ` > ${parts[i]}`;
      }
    }
    
    return result;
  };

  // Handle selection change
  const handleSelectionChange = (event: React.SyntheticEvent, nodeIds: string[]) => {
    onPathsChange(nodeIds);
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
                onDelete={() => {
                  const newSelection = selectedPaths.filter(p => p !== path);
                  onPathsChange(newSelection);
                }}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}
      
      {/* Tree View */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {!filteredItems || filteredItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0 
              ? 'Loading TestIt data...' 
              : 'No matching items found'
            }
          </Typography>
        ) : (
          <RichTreeView
            items={filteredItems}
            multiSelect
            checkboxSelection
            selected={selectedPaths}
            onSelectedChange={handleSelectionChange}
            aria-label="testit-paths"
            defaultExpandedItems={treeItems.map(item => item.id)}
          />
        )}
      </Paper>
    </Box>
  );
};

export default TestItTreeView;
