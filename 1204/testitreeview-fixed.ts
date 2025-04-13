import React, { useState, useEffect, useMemo } from 'react';
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

  /**
   * Expand all top-level projects by default (using their IDs).
   */
  useEffect(() => {
    if (testItData && testItData.length > 0) {
      const topLevelIds = testItData.map((p) => p.Project_Id || p.id).filter(Boolean);
      setExpanded(topLevelIds);
    }
  }, [testItData]);

  const toggleSelection = (path: string) => {
    if (selectedPaths.includes(path)) {
      const newPaths = selectedPaths.filter((p) => p !== path);
      onPathsChange(newPaths);
    } else {
      const newPaths = [...selectedPaths, path];
      onPathsChange(newPaths);
    }
  };

  /**
   * Filter top-level projects by the search text (searching by project name).
   */
  const filteredProjects = useMemo(() => {
    return searchText
      ? testItData.filter((p) =>
          p.Project_Name?.toLowerCase().includes(searchText.toLowerCase())
        )
      : testItData;
  }, [testItData, searchText]);

  /**
   * Convert a TestIt project to a TreeViewBaseItem for the RichTreeView
   */
  const convertProjectToTreeItem = (project: TestItProject): TreeViewBaseItem => {
    const id = project.Project_Id || project.id || `project-${project.Project_Name}`;
    
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
        id: `suite-${suite.Suite_Name}-${Math.random().toString(36).substr(2, 9)}`,
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
  const processedTreeItems = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) {
      return [];
    }
    
    return filteredProjects
      .filter(Boolean)
      .map(convertProjectToTreeItem)
      .filter(Boolean);
  }, [filteredProjects]);

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
    // Filter out any project-level IDs that are not path-based (shouldn't be selectable)
    const validPathIds = newSelectedIds.filter(id => id.includes(':'));
    
    // Only update if there's a change
    if (JSON.stringify(validPathIds.sort()) !== JSON.stringify(selectedPaths.sort())) {
      onPathsChange(validPathIds);
    }
  };

  // Memoize path names to avoid recalculation on every render
  const pathDisplayNames = useMemo(() => {
    return selectedPaths.map(path => ({
      path,
      displayName: getPathName(path)
    }));
  }, [selectedPaths, testItData]);

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
            {pathDisplayNames.map(({ path, displayName }) => (
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
                  primary={displayName} 
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
              items={processedTreeItems}
              checkboxSelection
              multiSelect
              disabledItemsFocusable
              aria-label="Test suites selection"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TestItTreeView;
