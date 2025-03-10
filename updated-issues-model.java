package com.ringcentral.engagemetrics.schedular.api.model.jira;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Issues {
    private String expand;
    private String id;
    private String self;
    private String key;
    private Fields fields;
    private Changelog changelog;
}
