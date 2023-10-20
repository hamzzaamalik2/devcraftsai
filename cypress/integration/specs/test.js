describe('Login', () => {
    const username = '518fpcgfbqmc7iombm7o82g5e1';
    const password = '518fpcgfbqmc7iombm7o82g5e1';
    const loginURL = 'https://app-sandbox.prospertech.io/';
  
    it('should log in to the website', () => {
      cy.visit(loginURL);
  
      cy.get('input[name="clientid"]').type(username);
      cy.get('input[name="clientsecret"]').type(password);
  
      cy.get('button[type="submit"]').click();
  
      // Do additional actions after login, e.g., clicking on buttons
      cy.contains('Link Account').click();
      cy.contains('Continue').click();
      cy.contains('Search').type('hbl');
    });
  });