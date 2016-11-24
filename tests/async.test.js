/**
 * A meta function to remove boilerplate code from async mocha tests
 */
const mochAsync = fn => async (done) => {
  try {
    await fn();
    done();
  } catch (err) {
    done(err);
  }
};

export default mochAsync;
