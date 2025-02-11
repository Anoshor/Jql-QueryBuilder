package com.example.Jqlquerybuilder.model;

public class JqlResponse {
    private String jql;
    private String explanation;

    public JqlResponse() {
    }

    public JqlResponse(String jql, String explanation) {
        this.jql = jql;
        this.explanation = explanation;
    }

    // Getters and Setters

    public String getJql() {
        return jql;
    }
    public void setJql(String jql) {
        this.jql = jql;
    }
    public String getExplanation() {
        return explanation;
    }
    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}
