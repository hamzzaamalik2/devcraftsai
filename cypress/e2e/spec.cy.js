describe("Add Event", () => {
  it("should add an event with provided details", () => {
    cy.visit("http://localhost:4201/dashboard");
    
    // Step 1: type Event name DEMO
    cy.get("input[name='name']").type("DEMO");
    
    // Step 2: type email is bilal@gmail.com
    cy.get("input[name='email']").type("bilal@gmail.com");
    
    // Step 3: Date Picker 2023-10-18 Start Date
    cy.get("input[name='startdate']").type("2023-10-18");
    
    // Step 4: Date Picker 2023-10-28 End Date
    cy.get("input[name='enddate']").type("2023-10-28");
    
    // Click on Add User button
    cy.get("button[type='submit'].btn-primary").click();
    
    // Assertions or any other necessary steps after adding the event
  });
});