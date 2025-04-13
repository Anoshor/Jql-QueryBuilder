import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
// Your custom step components
import { OrganizationStep } from './AdminConfig/OrganizationStep';
import { ProjectsStep } from './AdminConfig/ProjectsStep';
import { TeamsAndMembersStep } from './AdminConfig/TeamsAndMembersStep';
import { TestConfigStep } from './AdminConfig/TestConfigStep';
import { ReviewStep } from './AdminConfig/ReviewStep';
// Import the service and types
import AdminConfigService, { Project, Team, OrganizationConfig } from '../services/AdminConfigService';

// ----------- For the front-end states -----------
interface SonarConfig {
  sonarDomain: string;
  sonarProjects: string[];
}
export interface TeamConfig {
  testItPaths: string[]; // Using the path format "projectId:suiteId:childSuiteId..."
  sonarQubeProjects: SonarConfig[];
}

const AdminConfig: React.FC = () => {
  const steps = ['Organization', 'Projects', 'Teams & Members', 'Test Configuration', 'Review'];
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [projectTeams, setProjectTeams] = useState<Record<string, string[]>>({});
  const [teamMembers, setTeamMembers] = useState<Record<string, Record<string, string[]>>>({});
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [activeTeam, setActiveTeam] = useState<string>('');
  const [selectAllStatus, setSelectAllStatus] = useState<Record<string, boolean>>({});
  const [orgIdMap, setOrgIdMap] = useState<Record<string, string>>({});
  // Notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  // Data source from back-end
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  // Each project's each team's test/sonar config
  const [teamConfigs, setTeamConfigs] = useState<Record<string, Record<string, TeamConfig>>>({});

  // ----------------------------
  // On Mount / useEffects
  // ----------------------------
  useEffect(() => {
    const loadInitialTeams = async () => {
      try {
        const data = await AdminConfigService.fetchTeams();
        setTeams(data);
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    };
    const loadInitialProjects = async () => {
      try {
        const data = await AdminConfigService.fetchProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadInitialProjects();
    loadInitialTeams();
  }, []);

  useEffect(() => {
    const loadInitialOrg = async () => {
      try {
        const data = await AdminConfigService.fetchOrganizationConfig();
        const orgNames = data.map((item: OrganizationConfig) => item.organization);
        const orgMap = data.reduce((acc: Record<string, string>, item: OrganizationConfig) => {
          acc[item.organization] = item.id;
          return acc;
        }, {});
        setOrgIdMap(orgMap);
        setOrganizations(orgNames);
      } catch (error) {
        console.error('Error loading organizations:', error);
      }
    };
    if (activeStep === 0) {
      loadInitialOrg();
    }
    if (activeStep === 2) {
      setCurrentProjectIndex(0);
    }
  }, [activeStep]);

  // Current project in the tab
  const currentProject = selectedProjects[currentProjectIndex]?.key || '';
  const currentProjectTeams = projectTeams[currentProject] || [];
  const allTeams = Object.values(projectTeams).flat();

  useEffect(() => {
    if (activeTeam && !allTeams.includes(activeTeam)) {
      setActiveTeam('');
    }
  }, [allTeams, activeTeam]);

  useEffect(() => {
    if (selectedProjects.length > 0 && currentProjectIndex >= selectedProjects.length) {
      setCurrentProjectIndex(0);
    }
  }, [selectedProjects, currentProjectIndex]);

  // ----------------------------
  // Handlers
  // ----------------------------
  const handleOrgSelect = async (org: string) => {
    setSelectedOrg(org);
    const orgId = orgIdMap[org];
    if (orgId) {
      try {
        const data = await AdminConfigService.fetchOrganizationConfigByOrg(org);
        const projectsData = data.projects;
        const selectedProjectKeys = Object.keys(projectsData);
        const mappedProjects = selectedProjectKeys.map(key => ({
          id: projectsData[key].id || '',
          jiraId: projectsData[key].id || '',
          key: projectsData[key].projectName,
          name: projectsData[key].projectFullName || projectsData[key].projectName
        }));
        setSelectedProjects(mappedProjects);
        const newProjectTeams: Record<string, string[]> = {};
        const newTeamMembers: Record<string, Record<string, string[]>> = {};
        const newTeamConfigs: Record<string, Record<string, TeamConfig>> = {};
        Object.entries(projectsData).forEach(([projectKey, projectData]) => {
          const teamList = projectData.teams || [];
          const teamNames = teamList.map(team => team.name);
          newProjectTeams[projectKey] = teamNames;
          newTeamMembers[projectKey] = {};
          newTeamConfigs[projectKey] = {};
          teamList.forEach(team => {
            newTeamMembers[projectKey][team.name] = team.members || [];
            newTeamConfigs[projectKey][team.name] = {
              testItPaths: team.testItPaths || convertOldFormatToNewFormat(team.testItProjects || []),
              sonarQubeProjects: (team.sonarQubeProjects || []).map(obj => {
                const [sonarDomain, sonarProjects] = Object.entries(obj)[0];
                return { sonarDomain, sonarProjects };
              })
            };
          });
        });
        setProjectTeams(newProjectTeams);
        setTeamMembers(newTeamMembers);
        setTeamConfigs(newTeamConfigs);
        showSnackbar('Configuration loaded successfully', 'success');
      } catch (error) {
        console.error('Error loading config:', error);
        showSnackbar('Error loading config', 'error');
      }
    }
  };

  const convertOldFormatToNewFormat = (testItProjects: Array<Record<string, string[]>>) => {
    const paths: string[] = [];
    testItProjects.forEach(projectObj => {
      const entries = Object.entries(projectObj);
      if (entries.length > 0) {
        const [projectId, suiteIds] = entries[0];
        suiteIds.forEach(suiteId => {
          paths.push(`${projectId}:${suiteId}`);
        });
      }
    });
    return paths;
  };

  const handleDeleteOrg = async (orgId: string) => {
    const orgName = Object.keys(orgIdMap).find(k => orgIdMap[k] === orgId);
    if (!orgName) {
      setOrganizations(prev => prev.filter(o => o !== orgId));
      showSnackbar('Organization deleted successfully', 'success');
      return;
    }
    try {
      await AdminConfigService.deleteOrganizationConfig(orgId);
      setOrganizations(prevOrgs => prevOrgs.filter(org => orgIdMap[org] !== orgId));
      showSnackbar('Organization deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting organization:', error);
      showSnackbar('Error deleting organization', 'error');
    }
  };

  const handleAddNewOrg = (newOrgName: string) => {
    if (newOrgName.trim()) {
      setOrganizations(prev => [...prev, newOrgName.trim()]);
      setSelectedOrg(newOrgName.trim());
      setSelectedProjects([]);
      setProjectTeams({});
      setTeamMembers({});
      showSnackbar(`Organization "${newOrgName.trim()}" added`, 'success');
    }
  };

  const handleProjectToggle = (project: Project) => {
    setSelectedProjects(prev => {
      if (prev.some(p => p.key === project.key)) {
        const updated = prev.filter(p => p.key !== project.key);
        setProjectTeams(prevTeams => {
          const copy = { ...prevTeams };
          delete copy[project.key];
          return copy;
        });
        return updated;
      } else {
        return [...prev, project];
      }
    });
  };

  const handleTeamCheckbox = (team: string, project: string) => {
    setProjectTeams(prev => {
      const alreadySelected = prev[project] || [];
      let updatedTeams: string[];
      if (alreadySelected.includes(team)) {
        updatedTeams = alreadySelected.filter(t => t !== team);
        setTeamMembers(prevMembers => {
          const copy = { ...prevMembers };
          if(copy[project]) {
            delete copy[project][team];
          }
          return copy;
        });
        if (team === activeTeam) setActiveTeam('');
      } else {
        updatedTeams = [...alreadySelected, team];
        if (!teamMembers[project]) {
          setTeamMembers(prevMembers => ({
            ...prevMembers,
            [project]: {}
          }));
        }
        setActiveTeam(team);
      }
      return { ...prev, [project]: updatedTeams };
    });
  };

  const handleSetActiveTeam = (team: string) => {
    if (!currentProjectTeams.includes(team)) {
      handleTeamCheckbox(team, currentProject);
    } else {
      setActiveTeam(team);
    }
  };

  const handleTeamMemberToggle = (member: string, team: string, project: string) => {
    setTeamMembers(prev => {
      const projectObj = prev[project] || {};
      const current = projectObj[team] || [];
      const updated = current.includes(member)
        ? current.filter(m => m !== member)
        : [...current, member];
      return { ...prev, [project]: { ...projectObj, [team]: updated } };
    });
  };

  const handleToggleAllMembers = (team: string, project: string) => {
    const isAllSelected = selectAllStatus[`${project}-${team}`] || false;
    const allPossible = getTeamMembersList(team);
    setTeamMembers(prev => ({
      ...prev,
      [project]: {
        ...(prev[project] || {}),
        [team]: isAllSelected ? [] : allPossible
      }
    }));
    setSelectAllStatus(prev => ({
      ...prev,
      [`${project}-${team}`]: !isAllSelected
    }));
  };

  const handleProjectTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentProjectIndex(newValue);
    setActiveTeam('');
  };

  const getTeamMembersList = (teamName: string) => {
    const teamObj = teams.find(t => t.teamName === teamName);
    return teamObj ? teamObj.members.map(m => m.name) : [];
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'success'
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const resetForm = () => {
    setActiveStep(0);
    setSelectedOrg('');
    setSelectedProjects([]);
    setProjectTeams({});
    setTeamMembers({});
    setActiveTeam('');
    setCurrentProjectIndex(0);
    setSelectAllStatus({});
    setTeamConfigs({});
  };

  // Step 4: Test Config - handler for team config changes from TestItTreeView
  const handleTeamConfigChange = (project: string, team: string, config: TeamConfig) => {
    setTeamConfigs(prev => ({
      ...prev,
      [project]: { ...prev[project], [team]: config }
    }));
  };

  // ----------------------------
  // Stepper Navigation and Validation
  // ----------------------------
  const isStepValid = (): boolean => {
    switch (activeStep) {
      case 0:
        return selectedOrg !== '';
      case 1:
        return selectedProjects.length > 0;
      case 2: {
        const eachProjectHasTeam = selectedProjects.every(
          project => (projectTeams[project.key]?.length || 0) > 0
        );
        const eachTeamHasMembers = selectedProjects.every(project =>
          projectTeams[project.key]?.every(team => (teamMembers[project.key]?.[team]?.length || 0) > 0)
        );
        return eachProjectHasTeam && eachTeamHasMembers;
      }
      case 3:
        return selectedProjects.every(project =>
          projectTeams[project.key]?.every(team => {
            const cfg = teamConfigs[project.key]?.[team];
            if (!cfg) return true;
            const hasSomething = (cfg.testItPaths && cfg.testItPaths.length > 0) ||
                                 (cfg.sonarQubeProjects && cfg.sonarQubeProjects.length > 0 &&
                                  cfg.sonarQubeProjects.every(s => s.sonarProjects.length > 0));
            return hasSomething;
          })
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      if (activeStep === steps.length - 1) {
        saveConfiguration();
      } else {
        setActiveStep(prev => prev + 1);
      }
    } else {
      showSnackbar('Please complete all required fields in this step', 'warning');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const saveConfiguration = async () => {
    const projectsMap: Record<string, {
      projectName: string;
      projectFullName: string | null;
      teams: Array<{
        name: string;
        members: string[];
        testItPaths: string[];
        sonarQubeProjects: Array<Record<string, string[]>>;
      }>;
    }> = {};
    selectedProjects.forEach(project => {
      const teamsForProject = projectTeams[project.key] || [];
      const formattedTeams = teamsForProject.map(team => {
        const myConfig = teamConfigs[project.key]?.[team];
        const sonarQubeProjectsArr: Array<Record<string, string[]>> =
          myConfig?.sonarQubeProjects.map(s => ({ [s.sonarDomain]: s.sonarProjects })) || [];
        return {
          name: team,
          members: teamMembers[project.key]?.[team] || [],
          testItPaths: myConfig?.testItPaths || [],
          sonarQubeProjects: sonarQubeProjectsArr
        };
      });
      projectsMap[project.key] = {
        projectFullName: project.name,
        projectName: project.key,
        teams: formattedTeams
      };
    });
    const payload = { organization: selectedOrg, projects: projectsMap };
    try {
      if (orgIdMap[selectedOrg]) {
        const orgId = orgIdMap[selectedOrg];
        await AdminConfigService.updateOrganizationConfig(orgId, payload);
      } else {
        await AdminConfigService.createOrganizationConfig(payload);
      }
      showSnackbar('Configuration saved successfully!', 'success');
      resetForm();
    } catch (error) {
      console.error('Error saving configuration:', error);
      showSnackbar('Error saving configuration', 'error');
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {activeStep === 0 && (
          <OrganizationStep
            selectedOrg={selectedOrg}
            organizations={organizations}
            orgIdMap={orgIdMap}
            onOrgSelect={handleOrgSelect}
            onDeleteOrg={handleDeleteOrg}
            onAddNewOrg={handleAddNewOrg}
          />
        )}
        {activeStep === 1 && (
          <ProjectsStep
            selectedOrg={selectedOrg}
            projects={projects}
            selectedProjects={selectedProjects}
            onProjectToggle={handleProjectToggle}
          />
        )}
        {activeStep === 2 && (
          <TeamsAndMembersStep
            selectedProjects={selectedProjects}
            currentProjectIndex={currentProjectIndex}
            projectTeams={projectTeams}
            teamMembers={teamMembers}
            teams={teams}
            activeTeam={activeTeam}
            selectAllStatus={selectAllStatus}
            onProjectTabChange={handleProjectTabChange}
            onTeamCheckbox={handleTeamCheckbox}
            onSetActiveTeam={handleSetActiveTeam}
            onTeamMemberToggle={handleTeamMemberToggle}
            onToggleAllMembers={handleToggleAllMembers}
            isProjectValid={(project) => {
              if ((projectTeams[project]?.length || 0) === 0) return false;
              return projectTeams[project].every(team => (teamMembers[project]?.[team]?.length || 0) > 0);
            }}
          />
        )}
        {activeStep === 3 && (
          <TestConfigStep
            selectedProjects={selectedProjects}
            projectTeams={projectTeams}
            currentProjectIndex={currentProjectIndex}
            teamConfigs={teamConfigs}
            onProjectTabChange={handleProjectTabChange}
            onTeamConfigChange={handleTeamConfigChange}
          />
        )}
        {activeStep === 4 && (
          <ReviewStep
            selectedOrg={selectedOrg}
            selectedProjects={selectedProjects}
            projectTeams={projectTeams}
            teamMembers={teamMembers}
            teamConfigs={teamConfigs}
          />
        )}
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!isStepValid()}
          endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
          color={activeStep === steps.length - 1 ? 'success' : 'primary'}
        >
          {activeStep === steps.length - 1 ? 'Save Configuration' : 'Next'}
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminConfig;
