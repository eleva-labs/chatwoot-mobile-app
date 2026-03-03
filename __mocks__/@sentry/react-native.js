module.exports = {
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
  wrap: jest.fn(c => c),
  withScope: jest.fn(cb => cb({ setExtra: jest.fn() })),
};
