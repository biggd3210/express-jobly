"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/** ******************* test create */
describe("create", function () {
  const newJob = {
    title: "new",
    salary: 1,
    equity: 0.1,
    companyHandle: "c1"
  }
  test("checks for duplicate records before adding new record", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect (err instanceof BadRequestError).toBeTruthy();
    }
  });
  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: 4,
      title: 'new',
      salary: 1,
      equity: '0.1',
      companyHandle: 'c1',
    });

    const result = await db.query(`
      SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        id: 4,
        title: "new",
        salary: 1,
        equity: '0.1',
        company_handle: "c1"
      }
    ]);
  });
});

/** **************** test find all (Not all filter.) */
describe("findAll", function () {
  test("works with no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 1,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: 2,
        title: "j2",
        salary: 2,
        equity: "0.2",
        companyHandle: "c2",
      },
    ]);
  });
});

/** ***************** test find all with filter */
describe("findAllFilter", function () {
  test("trips if includes incorrect parameter", async function () {
    try {
      await Job.findAllFilter({ wrong : "wrong" })
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  test("works for correct params", async function () {
    const filterData = {
      title: "j",
      minSalary: 1,
      hasEquity: "true"
    }
    let jobs = await Job.findAllFilter(filterData);
    expect(jobs).toEqual([
      {
      id: 2,
      title: "j2",
      salary: 2,
      equity: "0.2",
      companyHandle: "c2",
      },
    ]);
  });
});

/********************* test find all jobs by company */
describe("findAllJobsByCompany", function () {
  /** this is basically duplicative of findAllFilter but with only possibleKey of 'companyHandle'
   * */
  test("trips for search without proper key", async function () {
    try {
      await Job.findAllFilter({ wrong : "wrong" })
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  test("works", async function () {
    const filterData = { companyHandle: "c1"}
    let jobs = await Job.findAllJobsByCompany(filterData);
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 1,
        equity: "0",
      }
    ]);
  });
});

/********************** test get(id) */
describe("test get by id", function () {
  test("not found for incorrect id", async function () {
    try {
      let job = await Job.get(999999);
      fail();
    } catch (err) {
    expect(err instanceof (NotFoundError)).toBeTruthy()
    }
  });
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 1,
      equity: "0",
      companyHandle: "c1",
    });
  });
});

describe("update", function () {
  test("works with appropriate params", async function () {
    const data = {
      title: "new",
      salary: 5,
      equity: 0.5,
    }
    await Job.update(1, data);
    const j1 = await Job.get(1);
    expect(j1).toEqual({
      id: 1,
      title: "new",
      salary: 5,
      equity: "0.5",
      companyHandle: "c1",
    });
  });
  test("fails with wrong data", async function () {
    try {
      const data = {
        wrong: "wrong",
      }
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("remove", function () {
  test("fails on incorrect id", async function () {
    try {
      await Job.remove(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("works", async function () {
    await Job.remove(1)
    const result = await db.query(`SELECT id FROM jobs WHERE id=1`);
    expect(result.rows.length).toEqual(0);
  })
})