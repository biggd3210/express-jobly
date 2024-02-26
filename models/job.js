"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilter, sqlFilterJobsByHandle } = require("../helpers/sql");

/** Related functions for job. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws BadRequestError if job already in database.
     * */

static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT id
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
        [title, companyHandle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title} at ${companyHandle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Find all jobs that match filter.
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * Only for companies that match input filters (contained in request query string). 
   * */

  static async findAllFilter(filterData) {
    /** filter only accepts these filter parameters.
     * For loop checks incoming keys against acceptable keys
     * */
    const possibleKeys = ['title', 'minSalary', 'hasEquity']
    for (let key in filterData) {
      if (!(possibleKeys.includes(key))) {
        throw new BadRequestError(`Filter parameter not supported: ${key}`);
      }
    }
    // if (filterData['minEmployees'] && filterData['maxEmployees']) {
    //   if (filterData['minEmployees'] > filterData['maxEmployees']) {
    //     throw new BadRequestError(`Minimum filter must be less than or equal to maximum filter: ${filterData['minEmployees']} !< ${filterData['maxEmployees']}`);
    //   }
    // }
    const { setCols, values } = sqlForFilter(filterData);
    const filterSql = `SELECT id,
                              title,
                              salary,
                              equity,
                              company_handle AS "companyHandle"
                        FROM jobs
                        WHERE ${setCols}
                        ORDER BY title`;

    const filteredJobs = await db.query(filterSql, [...values]);
    return filteredJobs.rows;
  }

  static async findAllJobsByCompany (filterData) {
    const possibleKeys = ['companyHandle']
    const keys = Object.keys(filterData);
    if (keys.length === 0) {
        throw new BadRequestError("No data");
    }
    for (let key in filterData) {
        if (!(possibleKeys.includes(key))) {
            throw new BadRequestError(`Filter parameter not supported: ${key}`)
        }
    }
    const sqlFilter = sqlFilterJobsByHandle(filterData);
    const filterSql = `select id,
                              title,
                              salary,
                              equity
                        FROM jobs
                        WHERE ${sqlFilter}
                        ORDER BY id`
    const jobs = await db.query(filterSql);
    return jobs.rows;
  }
  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;