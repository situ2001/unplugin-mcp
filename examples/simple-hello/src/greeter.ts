/**
 * A simple greeting module
 * @module greeter
 */

/**
 * Creates a greeting message for the specified name
 * @param {string} name - The name to greet
 * @returns {string} The greeting message
 */
export function greet(name: string): string {
  return `Hello, ${name}! Welcome to the MCP-enabled application.`;
}

/**
 * Creates a farewell message
 * @param {string} name - The name to say goodbye to
 * @returns {string} The farewell message
 */
export function farewell(name: string): string {
  return `Goodbye, ${name}! Hope to see you again soon.`;
}
