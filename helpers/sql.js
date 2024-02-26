const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/* Helper function. Takes parameters as 'data' object and an object of key value pairs to translate variable names into column names.   */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) {
    throw new BadRequestError("No data");
  }

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate)
  };
}

function sqlForFilter(filterData) {
  const keys = Object.keys(filterData);
  const values = [];
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => {
    if (colName === 'name' || colName === "title"){
      values.push(`%${filterData[colName]}%`);
      return `${colName} ILIKE $${idx + 1}`
    } else if (colName === 'minEmployees') {
      values.push(filterData[colName]);
      return `num_employees >= $${idx +1}`
    } else if (colName === 'maxEmployees') {
      values.push(filterData[colName]);
      return `num_employees <= $${idx +1}`
    } else if (colName === 'minSalary') {
      values.push(filterData[colName]);
      return `salary > $${idx+1}`
    } else if (colName === 'hasEquity' && filterData['hasEquity'] === "true") {
      const limit = 0;
      values.push(limit)
      console.log(`equity > $${idx+1}`)
      return `equity > $${idx+1}`
    }
  });
  
  return {
    setCols: cols.join(" AND "),
    values: values
  };
}

function sqlFilterJobsByHandle (filterData) {
  const keys = Object.keys(filterData);
  if (keys.length !== 1) throw new BadRequestError("Incorrect number of parameters for filter.");
  if (!filterData['companyHandle']) throw new BadRequestError("Incorrect parameter");
  const sqlFilter = `company_handle = '${filterData['companyHandle']}'`;
  return sqlFilter;
}

module.exports = { 
  sqlForPartialUpdate, 
  sqlForFilter,
  sqlFilterJobsByHandle 
};
