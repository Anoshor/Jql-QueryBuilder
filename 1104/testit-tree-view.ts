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
  
  // Process the testItData into the format expected by RichTreeView
  useEffect(() => {
    console.log('Processing TestIt data', testItData?.length || 0, 'projects');
    if (!testItData || testItData.length === 0) return;
    
    try {
      const items: TreeViewBaseItem[] = testItData.map(project => ({
        id: project['Project ID'],
        label: project['Project Name'],
        children: processTopLevelSuites(project)
      }));
      
      setTreeItems(items);
      console.log('Processed tree items', items.length);
    } catch (error) {
      console.error('Error processing TestIt data:', error);
    }
  }, [testItData]);
  
  // Process the top-level suites (Project_Test_Suites array)
  const processTopLevelSuites = (project: TestItProject): TreeViewBaseItem[] => {
    if (!project['Test Suites'] || project['Test Suites'].length === 0) {
      return [];
    }
    
    // Process each top-level suite
    return project['Test Suites'].map(topSuite => {
      const topSuiteId = `${project['Project ID']}:${topSuite.Suite_Id}`;
      
      return {
        id: topSuiteId,
        label: topSuite['Suite Name'] + (topSuite.Total_Test_Cases ? ` (${topSuite.Total_Test_Cases} tests)` : ''),
        children: processSecondLevelSuites(topSuite.Suites || [], topSuiteId)
      };
    });
  };
  
  // Process second-level suites (Suites array of a top-level suite)
  const processSecondLevelSuites = (suites: any[], parentId: string): TreeViewBaseItem[] => {
    if (!suites || suites.length === 0) {
      return [];
    }
    
    return suites.map(suite => {
      const suiteId = `${parentId}:${suite.Suite_Id}`;
      
      // Check if this suite has child suites
      const hasChildren = suite.Suites && suite.Suites.length > 0;
      
      return {
        id: suiteId,
        label: suite['Suite Name'] + (suite.Total_Test_Cases ? ` (${suite.Total_Test_Cases} tests)` : ''),
        children: hasChildren ? processThirdLevelSuites(suite.Suites, suiteId) : []
      };
    });
  };
  
  // Process third-level suites (and potentially deeper)
  const processThirdLevelSuites = (suites: any[], parentId: string): TreeViewBaseItem[] => {
    if (!suites || suites.length === 0) {
      return [];
    }
    
    return suites.map(suite => {
      const suiteId = `${parentId}:${suite.Suite_Id}`;
      
      // Recursively process any deeper levels
      const hasChildren = suite.Suites && suite.Suites.length > 0;
      
      return {
        id: suiteId,
        label: suite['Suite Name'] + (suite.Total_Test_Cases ? ` (${suite.Total_Test_Cases} tests)` : ''),
        children: hasChildren ? processThirdLevelSuites(suite.Suites, suiteId) : []
      };
    });
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
  
  // Get a human-readable name for a path
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 2) return path;
    
    const projectId = parts[0];
    const project = testItData?.find(p => p['Project ID'] === projectId);
    if (!project) return path;
    
    const result: string[] = [project['Project Name']];
    
    // Function to find a suite by its path parts
    const findSuiteName = (project: TestItProject, pathParts: string[]): string[] => {
      if (pathParts.length < 2) return [];
      
      const names: string[] = [];
      
      // First try to find the top-level suite
      const topSuiteId = pathParts[1];
      const topSuite = project['Test Suites']?.find(s => s.Suite_Id === topSuiteId);
      
      if (!topSuite) return names;
      
      names.push(topSuite['Suite Name']);
      
      if (pathParts.length < 3) return names;
      
      // Now try to find second-level suite
      const secondSuiteId = pathParts[2];
      const secondSuite = topSuite.Suites?.find((s: any) => s.Suite_Id === secondSuiteId);
      
      if (!secondSuite) return names;
      
      names.push(secondSuite['Suite Name']);
      
      if (pathParts.length < 4) return names;
      
      // Continue for deeper levels
      let currentSuites = secondSuite.Suites;
      for (let i = 3; i < pathParts.length; i++) {
        if (!currentSuites) break;
        
        const suiteId = pathParts[i];
        const suite = currentSuites.find((s: any) => s.Suite_Id === suiteId);
        
        if (!suite) break;
        
        names.push(suite['Suite Name']);
        currentSuites = suite.Suites;
      }
      
      return names;
    };
    
    // Get suite names and add them to the result
    const suiteNames = findSuiteName(project, parts);
    return result.concat(suiteNames).join(' > ');
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
        {(!treeItems || treeItems.length === 0) ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0 
              ? 'Loading TestIt data...' 
              : 'No test suites available'
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
