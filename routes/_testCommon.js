"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM jobs")
  //added following to control auto increment of primary key. 
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1")

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  const job1 = await Job.create({
    title: "j1",
    salary: 1,
    equity: 0.1,
    companyHandle: "c1", 
  });
  const job2 = await Job.create({
    title: "j2",
    salary: 2,
    equity: 0.2,
    companyHandle: 'c3',
  });
  const job3 = await Job.create({
    title: "j3",
    salary: 3,
    equity: 0.3,
    companyHandle: "c3",
  })
  const app1 = await User.applyToJob("u3", 1);
  const app2 = await User.applyToJob("u3", 2);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

/**
 * Modified u1Token to be admin as it's used in all functions with auth.
 * created nonAdminToken to create tests where admin authorization only was added. 
 * Added tests to suites containing nonAdminToken to verify nonAdmin is unable to authorize.
 */
const u1Token = createToken({ username: "u1", isAdmin: true });

const nonAdminToken = createToken({ username: "u2", isAdmin: false });

const u2Token = createToken({username: "u2", isAdmin: false });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  nonAdminToken,
};
