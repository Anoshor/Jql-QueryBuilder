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

  // Convert testItData to RichTreeView format
  useEffect(() => {
    if (!testItData || testItData.length === 0) return;

    const processedItems: TreeViewBaseItem[] = [];
    
    // For each project
    testItData.forEach(project => {
      const projectNode: TreeViewBaseItem = {
        id: project['Project ID'],
        label: project['Project Name'],
        children: []
      };
      
      // For each top-level suite
      if (project['Test Suites'] && project['Test Suites'].length > 0) {
        project['Test Suites'].forEach(topSuite => {
          // Create the top suite node
          const topSuiteNode: TreeViewBaseItem = {
            id: `${project['Project ID']}:${topSuite.Suite_Id}`,
            label: topSuite['Suite Name'],
            children: []
          };
          
          // Process second-level suites
          if (topSuite.Suites && topSuite.Suites.length > 0) {
            topSuite.Suites.forEach(secondLevelSuite => {
              const secondLevelNode: TreeViewBaseItem = {
                id: `${project['Project ID']}:${topSuite.Suite_Id}:${secondLevelSuite.Suite_Id}`,
                label: secondLevelSuite['Suite Name'],
                children: []
              };
              
              // Process third-level suites
              if (secondLevelSuite.Suites && secondLevelSuite.Suites.length > 0) {
                secondLevelSuite.Suites.forEach(thirdLevelSuite => {
                  const thirdLevelNode: TreeViewBaseItem = {
                    id: `${project['Project ID']}:${topSuite.Suite_Id}:${secondLevelSuite.Suite_Id}:${thirdLevelSuite.Suite_Id}`,
                    label: thirdLevelSuite['Suite Name'],
                    children: [] // Could go deeper if needed
                  };
                  
                  secondLevelNode.children.push(thirdLevelNode);
                });
              }
              
              topSuiteNode.children.push(secondLevelNode);
            });
          }
          
          projectNode.children.push(topSuiteNode);
        });
      }
      
      processedItems.push(projectNode);
    });
    
    setTreeItems(processedItems);
  }, [testItData]);

  // Filter items based on search text
  const filteredItems = React.useMemo(() => {
    if (!searchText) return treeItems;
    
    const searchLower = searchText.toLowerCase();
    
    // Helper function to filter tree items
    const filterItems = (items: TreeViewBaseItem[]): TreeViewBaseItem[] => {
      return items
        .map(item => {
          // Check if item matches search
          const matches = item.label.toLowerCase().includes(searchLower);
          
          // Process children
          let filteredChildren: TreeViewBaseItem[] = [];
          if (item.children && item.children.length > 0) {
            filteredChildren = filterItems(item.children);
          }
          
          // Keep if it matches or has matching children
          if (matches || filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren
            };
          }
          
          return null;
        })
        .filter((item): item is TreeViewBaseItem => item !== null);
    };
    
    return filterItems(treeItems);
  }, [searchText, treeItems]);

  // Get readable path name for display
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    const projectId = parts[0];
    const project = testItData.find(p => p['Project ID'] === projectId);
    
    if (!project) return path;
    
    let result = project['Project Name'];
    
    // Find suites by traversing the path
    if (parts.length > 1) {
      let currentData = project['Test Suites'] || [];
      let currentPath = projectId;
      
      for (let i = 1; i < parts.length; i++) {
        const suiteId = parts[i];
        let found = false;
        
        for (const suite of currentData) {
          if (suite.Suite_Id === suiteId) {
            result += ` > ${suite['Suite Name']}`;
            currentData = suite.Suites || [];
            found = true;
            break;
          }
        }
        
        if (!found) {
          result += ` > ${suiteId}`;
          break;
        }
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
                onDelete={() => {
                  onPathsChange(selectedPaths.filter(p => p !== path));
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
        {treeItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            Loading TestIt data...
          </Typography>
        ) : (
          <RichTreeView
            aria-label="test-it-paths"
            multiSelect
            checkboxSelection
            items={filteredItems}
            selected={selectedPaths}
            onSelectedChange={(event, nodeIds) => onPathsChange(nodeIds)}
          />
        )}
      </Paper>
    </Box>
  );
};

export default TestItTreeView;