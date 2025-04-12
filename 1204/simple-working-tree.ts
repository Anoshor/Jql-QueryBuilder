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
import { TestItProject, Suite } from './types';

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

  // This effect transforms your MongoDB data structure into the format expected by RichTreeView
  useEffect(() => {
    if (!testItData || testItData.length === 0) return;
    
    // Start by creating an array of TreeViewBaseItem for each project
    const items: TreeViewBaseItem[] = [];

    // For each project in your data
    testItData.forEach(project => {
      // Create a project node
      const projectNode: TreeViewBaseItem = {
        id: project['Project ID'],  // This will be the first part of the path
        label: project['Project Name'],
        children: []
      };

      // IMPORTANT: Process all Test_Suites for this project
      if (project['Test Suites'] && project['Test Suites'].length > 0) {
        
        // For each top-level suite in the project
        project['Test Suites'].forEach(topLevelSuite => {
          // Check if the Test_Suites item itself is a suite
          if (topLevelSuite.Suite_Id && topLevelSuite['Suite Name']) {
            // Create a node for this top-level suite
            const suiteNode = processTopLevelSuite(topLevelSuite, project['Project ID']);
            projectNode.children.push(suiteNode);
          }
          
          // Some projects might have suites inside a wrapper
          // If this top-level item has Suites property with child suites
          if (topLevelSuite.Suites && topLevelSuite.Suites.length > 0) {
            // Process all child suites
            topLevelSuite.Suites.forEach(childSuite => {
              // Create a path for this child suite using project ID and suite ID
              const suiteNode = processSecondLevelSuite(childSuite, project['Project ID'], topLevelSuite.Suite_Id);
              projectNode.children.push(suiteNode);
            });
          }
        });
      }
      
      // Add the complete project node to our items array
      items.push(projectNode);
    });
    
    setTreeItems(items);
    console.log("TreeItems created:", items.length, "projects");
  }, [testItData]);

  // Helper function to process a top-level suite
  // This creates a TreeViewBaseItem for a suite and processes its children
  const processTopLevelSuite = (suite: Suite, projectId: string): TreeViewBaseItem => {
    // The path for this suite is projectId:suiteId
    const path = `${projectId}:${suite.Suite_Id}`;
    
    // Create the base item for this suite
    const suiteNode: TreeViewBaseItem = {
      id: path,  // This is the path that will be used for selection
      label: suite['Suite Name'] + (suite.Total_Test_Cases ? ` (${suite.Total_Test_Cases} tests)` : ''),
      children: []
    };
    
    // Process any child suites - look in both Suites and Child_Suites
    const childSuites = [
      ...(suite.Suites || []),
      ...(suite.Child_Suites || [])
    ].filter(Boolean);
    
    // For each child suite, recursively process it
    if (childSuites.length > 0) {
      childSuites.forEach(childSuite => {
        if (childSuite && childSuite.Suite_Id) {
          // For each child, create a new node with path extended with this suite's ID
          const childNode = processSecondLevelSuite(childSuite, projectId, suite.Suite_Id);
          suiteNode.children.push(childNode);
        }
      });
    }
    
    return suiteNode;
  };

  // Helper function to process a second-level suite
  // Similar to processTopLevelSuite but adds one more level to the path
  const processSecondLevelSuite = (suite: Suite, projectId: string, parentSuiteId: string): TreeViewBaseItem => {
    // The path for this suite is projectId:parentSuiteId:suiteId
    const path = `${projectId}:${parentSuiteId}:${suite.Suite_Id}`;
    
    // Create the base item for this suite
    const suiteNode: TreeViewBaseItem = {
      id: path,
      label: suite['Suite Name'] + (suite.Total_Test_Cases ? ` (${suite.Total_Test_Cases} tests)` : ''),
      children: []
    };
    
    // Process any third-level suites - look in both Suites and Child_Suites
    const childSuites = [
      ...(suite.Suites || []),
      ...(suite.Child_Suites || [])
    ].filter(Boolean);
    
    // For each child suite, recursively process it
    if (childSuites.length > 0) {
      childSuites.forEach(childSuite => {
        if (childSuite && childSuite.Suite_Id) {
          // For each child, create a new node with path extended with this suite's ID
          const childNode = processThirdLevelSuite(childSuite, projectId, parentSuiteId, suite.Suite_Id);
          suiteNode.children.push(childNode);
        }
      });
    }
    
    return suiteNode;
  };

  // Helper function to process a third-level suite
  // This completes our 3-level handling as requested, but you can go deeper if needed
  const processThirdLevelSuite = (
    suite: Suite, 
    projectId: string, 
    grandparentSuiteId: string, 
    parentSuiteId: string
  ): TreeViewBaseItem => {
    // The path for this suite is projectId:grandparentSuiteId:parentSuiteId:suiteId
    const path = `${projectId}:${grandparentSuiteId}:${parentSuiteId}:${suite.Suite_Id}`;
    
    // Create the base item for this suite
    const suiteNode: TreeViewBaseItem = {
      id: path,
      label: suite['Suite Name'] + (suite.Total_Test_Cases ? ` (${suite.Total_Test_Cases} tests)` : ''),
      children: []
    };
    
    // Process any fourth-level suites - look in both Suites and Child_Suites
    // You can add more levels if needed by repeating this pattern
    const childSuites = [
      ...(suite.Suites || []),
      ...(suite.Child_Suites || [])
    ].filter(Boolean);
    
    // For each child suite, you could process further levels if needed
    if (childSuites.length > 0) {
      childSuites.forEach(childSuite => {
        if (childSuite && childSuite.Suite_Id) {
          // For deeper levels, you would create another helper function
          // For now, we'll just create leaf nodes (no more children)
          const childPath = `${path}:${childSuite.Suite_Id}`;
          const childNode: TreeViewBaseItem = {
            id: childPath,
            label: childSuite['Suite Name'] + 
                  (childSuite.Total_Test_Cases ? ` (${childSuite.Total_Test_Cases} tests)` : '')
          };
          suiteNode.children.push(childNode);
        }
      });
    }
    
    return suiteNode;
  };

  // Filter items based on search text
  const filteredItems = React.useMemo(() => {
    if (!searchText) return treeItems;
    
    const searchLower = searchText.toLowerCase();
    
    // Helper function to recursively filter tree items
    const filterItems = (items: TreeViewBaseItem[]): TreeViewBaseItem[] => {
      return items
        .map(item => {
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

  // Get readable path name for display in the selected chips
  // This converts "projectId:suiteId:childSuiteId" to "Project > Suite > ChildSuite"
  const getPathDisplayName = (path: string): string => {
    const parts = path.split(':');
    const projectId = parts[0];
    
    // Find the project
    const project = testItData?.find(p => p['Project ID'] === projectId);
    if (!project) return path;
    
    // Start with the project name
    let result = project['Project Name'];
    
    // If there are more parts, we need to find each suite in the hierarchy
    if (parts.length > 1) {
      // Find suite by recursively searching through the structure
      const findSuiteById = (
        suites: Suite[] | undefined, 
        suiteId: string
      ): Suite | null => {
        if (!suites || suites.length === 0) return null;
        
        for (const suite of suites) {
          if (!suite) continue;
          
          // Check if this is the suite we're looking for
          if (suite.Suite_Id === suiteId) {
            return suite;
          }
          
          // Check in Child_Suites
          if (suite.Child_Suites) {
            const found = findSuiteById(suite.Child_Suites, suiteId);
            if (found) return found;
          }
          
          // Check in Suites
          if (suite.Suites) {
            const found = findSuiteById(suite.Suites, suiteId);
            if (found) return found;
          }
        }
        
        return null;
      };
      
      // For each part of the path (after the project ID)
      for (let i = 1; i < parts.length; i++) {
        const suiteId = parts[i];
        let found = false;
        
        // Try to find the suite in the project's Test_Suites
        for (const topSuite of project['Test Suites']) {
          // Check if this top suite is the one we're looking for
          if (topSuite.Suite_Id === suiteId) {
            result += ` > ${topSuite['Suite Name']}`;
            found = true;
            break;
          }
          
          // If not, check in its Suites
          if (topSuite.Suites) {
            const suite = findSuiteById(topSuite.Suites, suiteId);
            if (suite) {
              result += ` > ${suite['Suite Name']}`;
              found = true;
              break;
            }
          }
        }
        
        // If we couldn't find this suite, just use the ID
        if (!found) {
          result += ` > ${suiteId}`;
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
                label={getPathDisplayName(path)}
                onDelete={() => {
                  // Remove this path from selection
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
        {treeItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {!testItData || testItData.length === 0 
              ? 'Loading TestIt data...' 
              : 'No test suites available'
            }
          </Typography>
        ) : (
          <RichTreeView
            aria-label="test-it-paths"
            multiSelect
            checkboxSelection
            items={filteredItems}
            selected={selectedPaths}
            onSelectedChange={(event, nodeIds) => onPathsChange(nodeIds)}
            defaultExpandedItems={treeItems.map(item => item.id)} // Auto-expand projects
          />
        )}
      </Paper>
      
      {/* DEBUG VIEW - Uncomment this to debug data conversion issues */}
      {/*
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2">Debug Info:</Typography>
        <Typography variant="body2">
          Original Projects: {testItData?.length || 0}
        </Typography>
        <Typography variant="body2">
          Tree Items: {treeItems.length}
        </Typography>
        <Typography variant="body2">
          Selected Paths: {selectedPaths.length}
        </Typography>
      </Box>
      */}
    </Box>
  );
};

export default TestItTreeView;
