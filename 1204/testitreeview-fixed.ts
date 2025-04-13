import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FolderOpen as FolderIcon,
  CheckCircle as CheckCircleIcon,
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
  onPathsChange,
}) => {
  // Which nodes are expanded in the TreeView
  const [expanded, setExpanded] = useState<string[]>([]);
  // For filtering top-level projects by name
  const [searchText, setSearchText] = useState('');
  // For debugging - display paths being processed
  const [debugInfo, setDebugInfo] = useState<{paths: string[], treeItems: any[]}>({
    paths: [],
    treeItems: []
  });

  /**
   * Expand all top-level projects by default (using their IDs).
   */
  useEffect(() => {
    if (testItData && testItData.length > 0) {
      const topLevelIds = testItData.map((p) => p.Project_Id || p.id).filter(Boolean);
      setExpanded(topLevelIds);
    }
  }, [testItData]);

  /**
   * Log selected paths on change for debugging
   */
  useEffect(() => {
    console.log("Current selectedPaths:", selectedPaths);
  }, [selectedPaths]);

  const toggleSelection = (path: string) => {
    console.log("Toggle selection for path:", path);
    if (selectedPaths.includes(path)) {
      const newPaths = selectedPaths.filter((p) => p !== path);
      console.log("Removing path, new paths:", newPaths);
      onPathsChange(newPaths);
    } else {
      const newPaths = [...selectedPaths, path];
      console.log("Adding path, new paths:", newPaths);
      onPathsChange(newPaths);
    }
  };

  /**
   * Filter top-level projects by the search text (searching by project name).
   */
  const filteredProjects = searchText
    ? testItData.filter((p) =>
        p.Project_Name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : testItData;

  /**
   * Convert a TestIt project to a TreeViewBaseItem for the RichTreeView
   */
  let idCounter = 0;
  const generateUniqueId = () => `generated-id-${idCounter++}`;

  const convertProjectToTreeItem = (project: TestItProject): TreeViewBaseItem => {
    const id = project.Project_Id || project.id || generateUniqueId();
    
    return {
      id,
      label: project.Project_Name || 'Unnamed Project',
      children: project.Project_Test_Suites?.map(suite => convertSuiteToTreeItem(suite, id)) || [],
    };
  };

  const convertSuiteToTreeItem = (suite: Suite, projectId: string, parentPath: string = ""): TreeViewBaseItem => {
    if (!suite) return null;
    
    const id = suite.Suite_Id;
    if (!id) {
      return {
        id: generateUniqueId(),
        label: suite.Suite_Name || 'Unnamed Suite'
      };
    }

    // Create a path-based ID using the project ID and suite ID
    const thisPath = parentPath 
      ? `${parentPath}:${id}`
      : `${projectId}:${id}`;
    
    const treeItem: TreeViewBaseItem = {
      id: thisPath,
      label: suite.Suite_Name || 'Unnamed Suite',
    };

    // Add test case count if available
    if (typeof suite.Total_Test_Cases === 'number' && suite.Total_Test_Cases > 0) {
      treeItem.labelText = `${suite.Suite_Name} (${suite.Total_Test_Cases} tests)`;
    }

    // Add children if they exist
    if (suite.Suites?.length) {
      treeItem.children = suite.Suites.map(childSuite => 
        convertSuiteToTreeItem(childSuite, projectId, thisPath)
      );
    }

    return treeItem;
  };

  /**
   * Process the testItData into a format compatible with RichTreeView
   */
  const processTestItData = (): TreeViewBaseItem[] => {
    if (!filteredProjects || filteredProjects.length === 0) {
      return [];
    }
    
    const treeItems = filteredProjects
      .filter(Boolean)
      .map(convertProjectToTreeItem)
      .filter(Boolean);
    
    // For debugging
    setDebugInfo({
      paths: selectedPaths,
      treeItems
    });
    
    return treeItems;
  };

  /**
   * Handle tree node expand/collapse
   */
  const handleToggle = (nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  /**
   * Convert a path (e.g. "projectId:suiteId:childSuiteId") to a readable chain.
   */
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 1) return path;
    
    const projectId = parts[0];
    const project = testItData.find((p) => (p.Project_Id || p.id) === projectId);
    if (!project) return path;
    
    let result = project.Project_Name || 'Unnamed Project';
    let currentSuites = project.Project_Test_Suites || [];
    
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];
      
      // Recursive helper to search suites by Suite_Id
      const findSuite = (suites: Suite[] = [], id: string): Suite | null => {
        for (const s of suites) {
          if (!s) continue;
          if (s.Suite_Id === id) return s;
          const inChild = findSuite(s.Suites || [], id);
          if (inChild) return inChild;
        }
        return null;
      };
      
      let suiteMatch: Suite | null = null;
      for (const wrapper of currentSuites) {
        if (!wrapper) continue;
        if (wrapper.Suite_Id === suiteId) {
          suiteMatch = wrapper;
          break;
        }
        if (wrapper.Suites) {
          suiteMatch = findSuite(wrapper.Suites, suiteId);
          if (suiteMatch) break;
        }
      }
      
      if (suiteMatch) {
        result += ` > ${suiteMatch.Suite_Name || 'Unnamed Suite'}`;
        currentSuites = suiteMatch.Suites || [];
      } else {
        result += ` > ${suiteId}`;
      }
    }
    
    return result;
  };

  /**
   * Handle checkbox selection changes from RichTreeView
   */
  const handleSelectionChange = (newSelectedIds: string[]) => {
    console.log("handleSelectionChange received:", newSelectedIds);
    
    // Filter out any project-level IDs that are not path-based (shouldn't be selectable)
    const validPathIds = newSelectedIds.filter(id => id.includes(':'));
    
    // Only update if there's a change
    if (JSON.stringify(validPathIds.sort()) !== JSON.stringify(selectedPaths.sort())) {
      console.log("Updating paths to:", validPathIds);
      onPathsChange(validPathIds);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search box for filtering projects */}
      <TextField
        fullWidth
        placeholder="Search projects by name..."
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
              <IconButton 
                size="small"
                onClick={() => setSearchText('')}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {/* Display selected paths as chips */}
      {selectedPaths.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, maxHeight: '200px', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="subtitle2">
              Selected Paths ({selectedPaths.length}):
            </Typography>
          </Box>
          <Divider sx={{ mb: 1 }} />
          <List dense>
            {selectedPaths.map((path) => (
              <ListItem
                key={path}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => toggleSelection(path)}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ 
                  py: 0.5, 
                  bgcolor: 'background.default',
                  mb: 0.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' } 
                }}
              >
                <ListItemText 
                  primary={getPathName(path)} 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {/* The TreeView using RichTreeView */}
      {!filteredProjects || filteredProjects.length === 0 ? (
        <Typography variant="body2" sx={{ py: 2 }}>
          {!testItData || testItData.length === 0
            ? 'Loading TestIt data...'
            : 'No projects match your search.'}
        </Typography>
      ) : (
        <Paper sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FolderIcon fontSize="small" sx={{ mr: 1 }} />
            Select Test Suites
            <Badge 
              badgeContent={selectedPaths.length} 
              color="primary" 
              sx={{ ml: 2 }}
              showZero
            />
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: '350px', overflow: 'auto' }}>
            <RichTreeView
              expanded={expanded}
              onExpandedChange={handleToggle}
              selected={selectedPaths}
              onSelectedChange={handleSelectionChange}
              items={processTestItData()}
              checkboxSelection
              multiSelect
              disabledItemsFocusable
              aria-label="Test suites selection"
            />
          </Box>
          
          {/* Render some debug info if needed */}
          {/* <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '0.75rem' }}>
            <Typography variant="caption">Selected Paths (for debugging): {debugInfo.paths.join(', ')}</Typography>
          </Box> */}
        </Paper>
      )}
    </Box>
  );
};

export default TestItTreeView;
