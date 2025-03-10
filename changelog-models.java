package com.ringcentral.engagemetrics.schedular.api.model.jira;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Changelog {
    private int startAt;
    private int maxResults;
    private int total;
    private List<History> histories;
}

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class History {
    private String id;
    private Author author;
    private String created;
    private List<HistoryItem> items;
}

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Author {
    private String self;
    private String name;
    private String key;
    private String emailAddress;
    private String displayName;
    private boolean active;
    private String timeZone;
}

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HistoryItem {
    private String field;
    private String fieldtype;
    private String from;
    private String fromString;
    private String to;
    private String toString;
}
