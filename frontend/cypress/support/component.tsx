// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";
// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from "cypress/react18";

import { Provider } from "react-redux";
import { Auth0Provider } from "@auth0/auth0-react";

import { store } from "../../src/state/store";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add("mount", (component, options = {}) => {
  // Use the default store if one is not provided
  const { reduxStore = store, ...mountOptions } = options;

  const wrapped = (
    <Auth0Provider
      domain="dev-xedas2iasb2dv6bb.us.auth0.com"
      clientId="q1355w8Tk2hrQDJYZFradQvw4g9GIHfu"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://galatea-backend/",
      }}
    >
      <Provider store={reduxStore}>{component}</Provider>
    </Auth0Provider>
  );

  return mount(wrapped, mountOptions);
});
