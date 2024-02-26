"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  nonAdminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
      title: "new",
      salary: 50000,
      equity: 0.5,
      companyHandle: "c1"
    };
  
    test("ok for admin users", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: { ...newJob, id: 4, equity: "0.5" },
      });
    });
  
    test("fails auth for non-admin users", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${nonAdminToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: "new",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: 1,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  
  /************************************** GET /jobs */
  
  describe("GET /jobs", function () {
    test("ok for anon", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
              {
                id: 1,
                title: "j1",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
              },
              {
                id: 2,
                title: "j2",
                salary: 2,
                equity: "0.2",
                companyHandle: "c3",
              },
              {
                id: 3,
                title: "j3",
                salary: 3,
                equity: "0.3",
                companyHandle: "c3"
              }
            ],
      });
    });
  
    test("fails: test next() handler", async function () {
      // there's no normal failure event which will cause this route to fail ---
      // thus making it hard to test that the error-handler works with it. This
      // should cause an error, all right :)
      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .get("/jobs")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });
  });
  
  /************************************** GET /jobs/:id */
  
  describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/1`);
      expect(resp.body).toEqual({
        job: {
          id: 1,
          title: "j1",
          salary: 1,
          equity: "0.1",
          companyHandle: "c1",
        },
      });
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app).get(`/jobs/999999`);
      expect(resp.statusCode).toEqual(404);
    });

    test("bad request err for incorrect type of param", async function () {
        const resp = await request(app).get(`/jobs/nope`);
        expect(resp.statusCode).toEqual(500);
    })
  });
  
  /************************************** PATCH /jobs/:id */
  
  describe("PATCH /jobs/:id", function () {
    test("works for admin users", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            title: "j1-new",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        job: {
          id: 1,
          title: "j1-new",
          salary: 1,
          equity: "0.1",
          companyHandle: "c1"
        },
      });
    });
  
    test("does not work for non-admin", async function () {
      const resp = await request(app)
        .patch('/jobs/1')
        .send({
          name: "j1-new",
        })
        .set("authorization", `Bearer ${nonAdminToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            name: "j1-new",
          });
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found on no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/nope`)
          .send({
            name: "new nope",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on id change attempt", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            id: "3",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on invalid data", async function () {
      const resp = await request(app)
          .patch(`/jobs/1`)
          .send({
            title: 4,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  
  /************************************** DELETE /jobs/:id */
  
  describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
      const resp = await request(app)
          .delete(`/jobs/1`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({ deleted: "1" });
    });
  
    test("unauth for nonAdmin", async function () {
      const resp = await request(app)
        .delete('/jobs/1')
        .set("authorization", `Bearer ${nonAdminToken}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/1`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job when param type is correct", async function () {
      const resp = await request(app)
          .delete(`/jobs/99999`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });

    test("not found for wrong param type (expects int => receives string", async function () {
      const resp = await request(app)
          .delete(`/jobs/nope`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });
  });