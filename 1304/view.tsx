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

// Helper: Generate unique IDs if needed.
let idCounter = 0;
const generateUniqueId = () => `generated-id-${idCounter++}`;

const TestItTreeView: React.FC<TestItTreeViewProps> = ({
  testItData,
  selectedPaths,
  onPathsChange,
}) => {
  const [searchText, setSearchText] = useState('');

  // Filter projects by search text (searching by Project_Name)
  const filteredProjects = searchText
    ? testItData.filter(p =>
        p.Project_Name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : testItData;

  // Convert a TestIt project into a TreeViewBaseItem
  const convertProjectToTreeItem = (project: TestItProject): TreeViewBaseItem => {
    let id = project.Project_Id || project.id;
    if (!id) {
      id = generateUniqueId();
    }
    return {
      id,
      label: project.Project_Name || 'Unnamed Project',
      children: project.Project_Test_Suites?.map(suite =>
        convertSuiteToTreeItem(suite, id)
      ) || undefined,
    };
  };

  // Convert a Suite into a TreeViewBaseItem using a path-based id.
  const convertSuiteToTreeItem = (suite: Suite, projectId: string): TreeViewBaseItem => {
    if (!suite || !suite.Suite_Id) return null;
    const itemId = `${projectId}:${suite.Suite_Id}`;
    const treeItem: TreeViewBaseItem = {
      id: itemId,
      label: suite.Suite_Name || 'Unnamed Suite',
    };
    if (typeof suite.Total_Test_Cases === 'number' && suite.Total_Test_Cases > 0) {
      // Optionally, you can include test counts inside the label or as secondary text.
      treeItem.label = `${suite.Suite_Name} (${suite.Total_Test_Cases} tests)`;
    }
    if (suite.Suites?.length) {
      treeItem.children = suite.Suites.map(child => convertSuiteToTreeItem(child, projectId));
    }
    return treeItem;
  };

  // Process testItData into tree items
  const processTestItData = (): TreeViewBaseItem[] => {
    if (!filteredProjects || filteredProjects.length === 0) return [];
    return filteredProjects.map(convertProjectToTreeItem).filter(Boolean);
  };

  // Handle selection changes from RichTreeView.
  const handleSelectionChange = (newSelectedIds: string[]) => {
    onPathsChange(newSelectedIds);
  };

  // Convert a path "projectId:suiteId:childSuiteId" into a friendly display name.
  const getPathName = (path: string): string => {
    const parts = path.split(':');
    if (parts.length < 1) return path;
    const projectId = parts[0];
    const project = testItData.find(p => (p.Project_Id || p.id) === projectId);
    if (!project) return path;
    let result = project.Project_Name;
    let currentSuites = project.Project_Test_Suites || [];
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];
      const findSuite = (suites: Suite[] = [], id: string): Suite | null => {
        for (const s of suites) {
          if (!s) continue;
          if (s.Suite_Id === id) return s;
          if (s.Suites) {
            const found = findSuite(s.Suites, id);
            if (found) return found;
          }
        }
        return null;
      };
      const suiteMatch = findSuite(currentSuites, suiteId);
      if (suiteMatch) {
        result += ` > ${suiteMatch.Suite_Name || 'Unnamed Suite'}`;
        currentSuites = suiteMatch.Suites || [];
      } else {
        result += ` > ${suiteId}`;
      }
    }
    return result;
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search projects..."
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
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
      {selectedPaths.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Paths ({selectedPaths.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedPaths.map(path => (
              <Chip
                key={path}
                label={getPathName(path)}
                onDelete={() => onPathsChange(selectedPaths.filter(p => p !== path))}
                size="small"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      )}
      {filteredProjects.length === 0 ? (
        <Typography variant="body2" sx={{ py: 2 }}>
          {!testItData || testItData.length === 0 ? 'Loading TestIt data...' : 'No projects match your search.'}
        </Typography>
      ) : (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
          <RichTreeView
            items={processTestItData()}
            selected={selectedPaths}
            onSelectedChange={handleSelectionChange}
            checkboxSelection
            multiSelect
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.label}
            getItemChildren={(item) => item.children || []}
            defaultExpandedItems={filteredProjects.map(project =>
              project.Project_Id || project.id
            )}
          />
        </Box>
      )}
    </Box>
  );
};

export default TestItTreeView;
