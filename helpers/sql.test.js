const { sqlForPartialUpdate, sqlForFilter } = require('../helpers/sql');
const { BadRequestError } = require("../expressError");

describe("Test sql helper script", function() {
    test("SQL for partial update converts input to usable text for sql from data object", function() {
        //set variables
        const data = {
            setCols: '\"name\"=$1, \"secondName\"=$2',
            values: ['New Company', 'Another Company']
        }
        const convertedSql = sqlForPartialUpdate(
            {
                "name" : "New Company",
                "secondName" : "Another Company"
            },
            {
                numEmployees: "num_employees",
                logoUrl: "logo_url",
              }
        )
        //expect statements
        expect(convertedSql).toEqual(data);
    })
    /** UNABLE TO APPROPRIATELY TEST FOR THROW NEW ERROR */
    // test("Empty data returns bad request error: No data", function () {
    //     const convertedSql = sqlForPartialUpdate({});
    //     console.log(typeof(convertedSql))
    //     expect(convertedSql).toThrow(new BadRequestError("No data"));
    // });
    
})