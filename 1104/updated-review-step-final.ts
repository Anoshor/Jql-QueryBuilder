import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AdminConfigService from '../../services/AdminConfigService';

interface Project {
  id: string;
  jiraId: string;
  key: string;
  name: string;
}

interface TeamConfig {
  testItPaths: string[]; // Using new path format
  sonarQubeProjects: Array<{
    sonarDomain: string;
    sonarProjects: string[];
  }>;
}

interface ReviewStepProps {
  selectedOrg: string;
  selectedProjects: Project[];
  projectTeams: Record<string, string[]>;
  teamMembers: Record<string, Record<string, string[]>>;
  teamConfigs: Record<string, Record<string, TeamConfig>>;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  selectedOrg,
  selectedProjects,
  projectTeams,
  teamMembers,
  teamConfigs,
}) => {
  const theme = useTheme();
  const [testItData, setTestItData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchTestItData = async () => {
      try {
        const [testItResponse] = await AdminConfigService.fetchTestItAndSonarData();
        setTestItData(testItResponse);
      } catch (error) {
        console.error('Error fetching TestIt data:', error);
      }
    };
    fetchTestItData();
  }, []);

  // Calculate total teams
  const totalTeams = Object.values(projectTeams).flat().length;
  
  // Calculate total members
  const totalMembers = Object.values(teamMembers).reduce(
    (total, projectMembers) =>
      total +
      Object.values(projectMembers).reduce(
        (teamTotal, memberArray) => teamTotal + memberArray.length,
        0
      ),
    0
  );

  // Helper function to get a readable name for a TestIt path
  const getPathDisplayName = (path: string): string => {
    if (!testItData.length) return path;
    
    const parts = path.split(':');
    const projectId = parts[0];
    const project = testItData.find(p => p['Project ID'] === projectId);
    
    if (!project) return path;
    
    let displayName = project['Project Name'];
    let currentSuites = project['Test Suites'][0]?.Suites || [];
    
    for (let i = 1; i < parts.length; i++) {
      const suiteId = parts[i];
      const suite = currentSuites.find((s: any) => s.Suite_Id === suiteId);
      
      if (suite) {
        displayName += ` > ${suite['Suite Name']}`;
        currentSuites = suite.Child_Suites || [];
      } else {
        displayName += ` > ${suiteId}`;
        break;
      }
    }
    
    return displayName;
  };

  // Group TestIt paths by project for better display
  const groupPathsByProject = (paths: string[]) => {
    const grouped: Record<string, string[]> = {};
    
    paths.forEach(path => {
      const parts = path.split(':');
      const projectId = parts[0];
      
      if (!grouped[projectId]) {
        grouped[projectId] = [];
      }
      
      grouped[projectId].push(path);
    });
    
    return grouped;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Configuration
      </Typography>
      
      {/* Organization */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Organization
        </Typography>
        <Typography variant="body1">{selectedOrg}</Typography>
      </Box>
      
      {/* Projects */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Selected Projects
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedProjects.map((project) => (
            <Chip 
              key={project.key} 
              label={`${project.name} (${project.key})`} 
            />
          ))}
        </Box>
      </Box>
      
      {/* Teams and Members */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Teams and Members
        </Typography>
        {selectedProjects.map((project) => (
          <Box key={project.key} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {project.name} ({project.key})
            </Typography>
            {projectTeams[project.key]?.map((team) => (
              <Box key={team} sx={{ ml: 2, mb: 1 }}>
                <Typography variant="body1">
                  {team}
                  <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                    ({teamMembers[project.key]?.[team]?.length || 0} members)
                  </Box>
                </Typography>
                <Box sx={{ ml: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {teamMembers[project.key]?.[team]?.map((member) => (
                    <Chip key={member} label={member} size="small" />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      
      {/* Test Configuration */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Test Configuration
        </Typography>
        {selectedProjects.map((project) => (
          <Box key={project.key} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {project.name} ({project.key})
            </Typography>
            {projectTeams[project.key]?.map((team) => {
              const config = teamConfigs[project.key]?.[team];
              const groupedPaths = config?.testItPaths 
                ? groupPathsByProject(config.testItPaths)
                : {};
              
              return (
                <Box key={team} sx={{ ml: 2, mb: 1 }}>
                  <Typography variant="body1">{team}</Typography>
                  
                  {/* TestIt Paths */}
                  {config?.testItPaths && config.testItPaths.length > 0 && (
                    <Box sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        TestIt Paths ({config.testItPaths.length}):
                      </Typography>
                      {Object.entries(groupedPaths).map(([projectId, paths]) => {
                        const project = testItData.find(p => p['Project ID'] === projectId);
                        const projectName = project ? project['Project Name'] : projectId;
                        
                        return (
                          <Box key={projectId} sx={{ ml: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {projectName}
                              <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}>
                                ({paths.length} paths)
                              </Box>
                            </Typography>
                            <Box sx={{ ml: 2 }}>
                              {paths.map(path => (
                                <Typography key={path} variant="body2" sx={{ color: 'text.secondary' }}>
                                  • {getPathDisplayName(path).split(' > ').slice(1).join(' > ')}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  
                  {/* SonarQube Projects */}
                  {config?.sonarQubeProjects.length > 0 && (
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        SonarQube Projects:
                      </Typography>
                      {config.sonarQubeProjects.map((sonar) => (
                        <Box key={sonar.sonarDomain} sx={{ ml: 2 }}>
                          <Typography variant="body2">
                            {sonar.sonarDomain}
                            <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                              ({sonar.sonarProjects.length} projects)
                            </Box>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      
      {/* Summary Statistics */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          bgcolor: alpha(theme.palette.success.light, 0.1),
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Typography variant="body2">• Organization: {selectedOrg}</Typography>
        <Typography variant="body2">• Total Projects: {selectedProjects.length}</Typography>
        <Typography variant="body2">• Total Teams: {totalTeams}</Typography>
        <Typography variant="body2">• Total Team Members: {totalMembers}</Typography>
      </Box>
    </Box>
  );
};