package com.ringcentral.engagemetrics.database.mongo.documents;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Field;
import java.util.List;
import java.util.Map;

@Setter
@Getter
public class AdminConfigTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Field("Team_Name")
    private String name;
    
    @Field("Team_Members")
    private List<String> members;
    
    @Field("Test_It_Paths")
    private List<String> testItPaths;  // New field: using format "projectId:suiteId:childSuiteId:..."
    
    @Field("Test_It_Projects")
    private List<Map<String, List<String>>> testItProjects;  // Legacy field: {testitPproject: [test it suite_names]}
    
    @Field("Sonar_Qube_Projects")
    private List<Map<String, List<String>>> sonarQubeProjects;  // {sonar_domain: [a, b, c, d]}
    
    @Field("Scrum_Board_Id")
    private String scrumBoardId;
    
    @Field("Scrum_Board_Name")
    private String scrumBoardName;
    
    @Field("Story_Point_Per_Member")
    private Integer storyPointsPerMemberPerSprint;
}