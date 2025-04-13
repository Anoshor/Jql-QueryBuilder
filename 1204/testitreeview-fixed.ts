import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
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
      onPathsChange(selectedPaths.filter((p) => p !== path));
    } else {
      onPathsChange([...selectedPaths, path]);
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
    let id = project.Project_Id || project.id;
    if (!id) {
      id = generateUniqueId();
    }
    
    return {
      id,
      label: project.Project_Name || 'Unnamed Project',
      children: project.Project_Test_Suites?.map(suite => convertSuiteToTreeItem(suite, id)) || undefined,
    };
  };

  const convertSuiteToTreeItem = (suite: Suite, projectId: string): TreeViewBaseItem => {
    if (!suite) return null;
    
    const id = suite.Suite_Id;
    if (!id) {
      return {
        id: generateUniqueId(),
        label: suite.Suite_Name || 'Unnamed Suite'
      };
    }

    // Create a path-based ID using the project ID and suite ID
    const itemId = `${projectId}:${id}`;
    
    const treeItem: TreeViewBaseItem = {
      id: itemId,
      label: suite.Suite_Name || 'Unnamed Suite',
    };

    // Add test case count if available
    if (typeof suite.Total_Test_Cases === 'number' && suite.Total_Test_Cases > 0) {
      treeItem.labelText = `${suite.Suite_Name} (${suite.Total_Test_Cases} tests)`;
    }

    // Add children if they exist
    if (suite.Child_Suites?.length) {
      treeItem.children = suite.Child_Suites.map(childSuite => 
        convertSuiteToTreeItem(childSuite, projectId)
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
    
    return filteredProjects
      .filter(Boolean)
      .map(convertProjectToTreeItem)
      .filter(Boolean); // Filter out any nulls that might have been created
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
          const inChild = findSuite(s.Child_Suites || [], id);
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
        if (wrapper.Child_Suites) {
          suiteMatch = findSuite(wrapper.Child_Suites, suiteId);
          if (suiteMatch) break;
        }
      }
      
      if (suiteMatch) {
        result += ` > ${suiteMatch.Suite_Name || 'Unnamed Suite'}`;
        currentSuites = suiteMatch.Child_Suites || [];
      } else {
        result += ` > ${suiteId}`;
      }
    }
    
    return result;
  };

  /**
   * Handle checkbox selection changes
   */
  const handleSelectionChange = (newSelectedIds: string[]) => {
    onPathsChange(newSelectedIds);
  };

  // For debugging
  console.log('Processed Tree Items:', processTestItData());

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
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Paths ({selectedPaths.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPaths.map((path) => (
              <Chip
                key={path}
                label={getPathName(path)}
                onDelete={() => toggleSelection(path)}
                size="small"
                color="primary"
              />
            ))}
          </Box>
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
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
          <RichTreeView
            expanded={expanded}
            onExpandedChange={handleToggle}
            selected={selectedPaths}
            onSelectedChange={handleSelectionChange}
            items={processTestItData()}
            checkboxSelection
            multiSelect
          />
        </Box>
      )}
    </Box>
  );
};

export default TestItTreeView;