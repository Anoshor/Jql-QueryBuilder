package com.example.Jqlquerybuilder.utils;

import com.example.Jqlquerybuilder.model.Condition;

import java.util.*;

public class JqlConstants {

    public static final List<String> FIELDS = Arrays.asList(
            "project", "issuetype", "status", "priority", "assignee",
            "reporter", "created", "updated", "labels", "component",
            "fixVersion", "duedate"
    );

    public static final List<String> OPERATORS = Arrays.asList(
            "=", "!=", ">", ">=", "<", "<=", "IN", "NOT IN", "~", "!~", "IS", "IS NOT"
    );

    public static final List<String> CONJUNCTIONS = Arrays.asList("AND", "OR");

    public static final Map<String, String> OPERATOR_DESCRIPTIONS = new HashMap<>();
    static {
        OPERATOR_DESCRIPTIONS.put("=", "exactly matches");
        OPERATOR_DESCRIPTIONS.put("!=", "does not match");
        OPERATOR_DESCRIPTIONS.put(">", "is after");
        OPERATOR_DESCRIPTIONS.put(">=", "is on or after");
        OPERATOR_DESCRIPTIONS.put("<", "is before");
        OPERATOR_DESCRIPTIONS.put("<=", "is on or before");
        OPERATOR_DESCRIPTIONS.put("IN", "is any of");
        OPERATOR_DESCRIPTIONS.put("NOT IN", "is not any of");
        OPERATOR_DESCRIPTIONS.put("~", "contains");
        OPERATOR_DESCRIPTIONS.put("!~", "does not contain");
        OPERATOR_DESCRIPTIONS.put("IS", "is");
        OPERATOR_DESCRIPTIONS.put("IS NOT", "is not");
    }

    public static final List<String> QUOTED_FIELDS = Arrays.asList(
            "project", "issuetype", "status", "priority", "assignee",
            "reporter", "labels", "component", "fixVersion"
    );

    public static final List<String> DATE_FIELDS = Arrays.asList("created", "updated", "duedate");

    public static final List<String> JQL_FUNCTIONS = Arrays.asList(
            "currentUser()", "startOfDay()", "endOfDay()", "startOfWeek()",
            "endOfWeek()", "startOfMonth()", "endOfMonth()"
    );

    public static final Condition DEFAULT_CONDITION = new Condition(1, "project", "=", "", "AND");

    public static final Map<String, String> FIELD_EXAMPLES = new HashMap<>();
    static {
        FIELD_EXAMPLES.put("project", "PROJ");
        FIELD_EXAMPLES.put("issuetype", "Bug");
        FIELD_EXAMPLES.put("status", "In Progress");
        FIELD_EXAMPLES.put("priority", "High");
        FIELD_EXAMPLES.put("assignee", "currentUser()");
        FIELD_EXAMPLES.put("created", "startOfDay(-7d)");
        FIELD_EXAMPLES.put("labels", "frontend");
        FIELD_EXAMPLES.put("component", "API");
        FIELD_EXAMPLES.put("fixVersion", "2.0");
    }
}