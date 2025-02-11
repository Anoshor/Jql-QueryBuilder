package com.example.Jqlquerybuilder.model;

public class Condition {
    private Integer id;
    private String field;
    private String operator;
    private String value;
    private String conjunction;

    public Condition() {
    }

    public Condition(Integer id, String field, String operator, String value, String conjunction) {
        this.id = id;
        this.field = field;
        this.operator = operator;
        this.value = value;
        this.conjunction = conjunction;
    }

    // Getters and Setters

    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getField() {
        return field;
    }
    public void setField(String field) {
        this.field = field;
    }
    public String getOperator() {
        return operator;
    }
    public void setOperator(String operator) {
        this.operator = operator;
    }
    public String getValue() {
        return value;
    }
    public void setValue(String value) {
        this.value = value;
    }
    public String getConjunction() {
        return conjunction;
    }
    public void setConjunction(String conjunction) {
        this.conjunction = conjunction;
    }
}