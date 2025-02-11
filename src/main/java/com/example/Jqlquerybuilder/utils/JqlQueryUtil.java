package com.example.Jqlquerybuilder.utils;

import com.example.Jqlquerybuilder.model.Condition;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class JqlQueryUtil {

    /**
     * Formats a single condition into a JQL fragment.
     */
    public static String formatCondition(Condition condition) {
        if (condition.getValue() == null || condition.getValue().trim().isEmpty()) {
            return "";
        }
        String field = condition.getField();
        String operator = condition.getOperator();
        String value = condition.getValue();

        // Handle IN and NOT IN operators
        if ("IN".equals(operator) || "NOT IN".equals(operator)) {
            return field + " " + operator + " (" + value + ")";
        }

        // If field needs quotes and value is not a function (does not contain "(")
        if (JqlConstants.QUOTED_FIELDS.contains(field) && !value.contains("(")) {
            return field + " " + operator + " \"" + value + "\"";
        }

        return field + " " + operator + " " + value;
    }

    /**
     * Generates a complete JQL query from a list of conditions.
     */
    public static String generateJqlQuery(List<Condition> conditions) {
        StringBuilder query = new StringBuilder();
        for (int i = 0; i < conditions.size(); i++) {
            Condition condition = conditions.get(i);
            String formatted = formatCondition(condition);
            if (formatted.isEmpty()) {
                continue;
            }
            if (query.length() == 0) {
                query.append(formatted);
            } else {
                query.append(" ").append(condition.getConjunction()).append(" ").append(formatted);
            }
        }
        return query.toString();
    }

    /**
     * Generates a human-readable explanation for a single condition.
     */
    public static String generateExplanation(Condition condition) {
        if (condition.getValue() == null || condition.getValue().trim().isEmpty()) {
            return "Looking for issues where " + condition.getField() + " " +
                    JqlConstants.OPERATOR_DESCRIPTIONS.get(condition.getOperator()) + "...";
        }
        String valueDisplay = condition.getValue();

        // For IN/NOT IN, split and join with "or"
        if ("IN".equals(condition.getOperator()) || "NOT IN".equals(condition.getOperator())) {
            String[] parts = valueDisplay.split(",");
            valueDisplay = Arrays.stream(parts)
                    .map(String::trim)
                    .collect(Collectors.joining(" or "));
        }

        if (JqlConstants.DATE_FIELDS.contains(condition.getField())) {
            return condition.getField() + " date " +
                    JqlConstants.OPERATOR_DESCRIPTIONS.get(condition.getOperator()) + " " + valueDisplay;
        }

        return condition.getField() + " " +
                JqlConstants.OPERATOR_DESCRIPTIONS.get(condition.getOperator()) + " " + valueDisplay;
    }

    /**
     * Combines multiple condition explanations into one.
     */
    public static String getCombinedExplanation(List<Condition> conditions) {
        boolean hasValue = conditions.stream()
                .anyMatch(c -> c.getValue() != null && !c.getValue().trim().isEmpty());
        if (!hasValue) {
            return "Start building your filter by selecting criteria above";
        }

        StringBuilder explanation = new StringBuilder();
        boolean first = true;
        for (Condition condition : conditions) {
            if (condition.getValue() == null || condition.getValue().trim().isEmpty()) {
                continue;
            }
            String exp = generateExplanation(condition);
            if (first) {
                explanation.append("Find issues where ").append(exp);
                first = false;
            } else {
                explanation.append(" ").append(condition.getConjunction().toLowerCase()).append(" ").append(exp);
            }
        }
        return explanation.toString();
    }
}


//These utility methods are then called by the JqlQueryService.java file, which acts as a service layer to build the final query and explanation. Finally, the JqlController.java REST controller uses the service to process incoming requests and return the generated JQL and explanation.
//
//        So, while JqlQueryUtil.java holds the primary logic for constructing the query, the overall query builder functionality is spread across:
//
//JqlQueryUtil.java – Contains the methods for building and formatting the JQL.
//        JqlQueryService.java – Wraps the utility methods and provides a service to the controller.
//        JqlController.java – Exposes the API endpoint that clients use to generate queries.