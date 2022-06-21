import GraphQL from "graphql";
import OlympicWinner from "./models/olympicWinner.js";
import { GraphQLJSON } from "graphql-scalars";

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLSchema,
  GraphQLInputObjectType,
  GraphQLID,
} = GraphQL;

const AthleteType = new GraphQLObjectType({
  name: "OlympicWinner",
  fields: () => ({
    id: { type: GraphQLID },
    athlete: { type: GraphQLString },
    age: { type: GraphQLInt },
    country: { type: GraphQLString },
    year: { type: GraphQLInt },
    date: { type: GraphQLString },
    sport: { type: GraphQLString },
    gold: { type: GraphQLInt },
    silver: { type: GraphQLInt },
    bronze: { type: GraphQLInt },
    total: { type: GraphQLInt },
  }),
});

const ResponseType = new GraphQLObjectType({
  name: "Response",
  fields: () => ({
    rows: { type: new GraphQLList(AthleteType) },
    lastRow: { type: GraphQLInt },
  }),
});

const RowGroupType = new GraphQLInputObjectType({
  name: "RowGroup",
  fields: () => ({
    id: { type: GraphQLString },
    aggFunc: { type: GraphQLString },
    field: { type: GraphQLString },
    displayName: { type: GraphQLString },
  }),
});

function doTextFilterQuery(
  column: string,
  type: any,
  filterTerm: string | RegExp
) {
  const queryObj: any = {};
  switch (type) {
    case "contains":
      queryObj[`${column}`] = { $in: [new RegExp(filterTerm, "i")] };
      break;
    case "notContains":
      queryObj[`${column}`] = { $nin: [new RegExp(filterTerm, "i")] };
      break;
    case "equals":
      queryObj[`${column}`] = { $eq: filterTerm };
      break;
    case "notEqual":
      queryObj[`${column}`] = { $ne: filterTerm };
      break;
    case "startsWith":
      queryObj[`${column}`] = {
        $in: [new RegExp("^" + filterTerm, "i")],
      };
      break;
    case "endsWith":
      queryObj[`${column}`] = {
        $in: [new RegExp(filterTerm + "$", "i")],
      };
      break;
  }
  return queryObj;
}

function doNumberFilterQuery(
  column: string,
  type: any,
  filterTerm: any,
  filterTo: any
) {
  const queryObj: any = {};
  switch (type) {
    case "equals":
      queryObj[`${column}`] = { $eq: filterTerm };
      break;
    case "notEqual":
      queryObj[`${column}`] = { $ne: filterTerm };
      break;
    case "greaterThan":
      queryObj[`${column}`] = { $gt: filterTerm };
      break;
    case "greaterThanOrEqual":
      queryObj[`${column}`] = { $gte: filterTerm };
      break;
    case "lessThan":
      queryObj[`${column}`] = { $lt: filterTerm };
      break;
    case "inRange":
      const lessThanObj: any = {};
      const greaterThanObj: any = {};
      lessThanObj[`${column}`] = { $lte: filterTo };
      greaterThanObj[`${column}`] = { $gte: filterTerm };
      queryObj[`$and`] = [lessThanObj, greaterThanObj];
      break;
  }
  return queryObj;
}

//setFilter
function doSetFilterQuery(column: string, filterValues: any) {
  const queryObj: any = {};
  queryObj[`${column}`] = { $in: filterValues };
  return queryObj;
}

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    getRows: {
      type: ResponseType,
      args: {
        // ** non-nulls are required **
        rowGroups: { type: new GraphQLList(RowGroupType) },
        groupKeys: { type: GraphQLJSON },
        sortModel: { type: GraphQLJSON },
        filterModel: { type: GraphQLJSON },
        startRow: { type: GraphQLInt },
        endRow: { type: GraphQLInt },
      },
      resolve(_: any, args: any) {
        return new Promise((resolve, reject) => {
          const aggregationPipeline: any = [];
          //filtering
          if (args.filterModel) {
            Object.keys(args.filterModel).forEach((key) => {
              const filterType = args.filterModel[key].filterType;
              const filterMode = args.filterModel[key].type;
              const filterTerm = args.filterModel[key].filter;
              const filterTo = args.filterModel[key].filterTo
                ? args.filterModel[key].filterTo
                : null;
              const filterValues = args.filterModel[key].values
                ? args.filterModel[key].values
                : null;
              const filterOperator = args.filterModel[key].operator
                ? args.filterModel[key].operator
                : null;
              let query: any = null;
              switch (filterType) {
                case "text":
                  if (filterOperator) {
                    query = {};
                    const condition1Query = doTextFilterQuery(
                      key,
                      args.filterModel[key].condition1.type,
                      args.filterModel[key].condition1.filter
                    );
                    const condition2Query = doTextFilterQuery(
                      key,
                      args.filterModel[key].condition2.type,
                      args.filterModel[key].condition2.filter
                    );
                    if (filterOperator == "AND") {
                      query["$and"] = [condition1Query, condition2Query];
                    } else if (filterOperator == "OR") {
                      query["$or"] = [condition1Query, condition2Query];
                    }
                  } else {
                    query = doTextFilterQuery(key, filterMode, filterTerm);
                  }
                  break;
                case "number":
                  if (filterOperator) {
                    query = {};
                    let condition1Query = doNumberFilterQuery(
                      key,
                      args.filterModel[key].condition1.type,
                      args.filterModel[key].condition1.filter,
                      args.filterModel[key].condition1.filterTo
                    );
                    let condition2Query = doNumberFilterQuery(
                      key,
                      args.filterModel[key].condition2.type,
                      args.filterModel[key].condition2.filter,
                      args.filterModel[key].condition1.filterTo
                    );
                    if (filterOperator == "AND") {
                      query["$and"] = [condition1Query, condition2Query];
                    } else if (filterOperator == "OR") {
                      query["$or"] = [condition1Query, condition2Query];
                    }
                  } else {
                    query = doNumberFilterQuery(
                      key,
                      filterMode,
                      filterTerm,
                      filterTo
                    );
                  }
                  break;
                case "set":
                  query = doSetFilterQuery(key, filterValues);
                  break;
              }
              aggregationPipeline.push({
                $match: query,
              });
            });
          }
          //sorting
          if (args.sortModel?.length > 0) {
            args.sortModel.forEach((model: { sort: any; colId: any }) => {
              const { sort, colId } = model;
              const ascObj: any = {};
              const descObj: any = {};
              ascObj[colId] = 1;
              descObj[colId] = -1;

              switch (sort) {
                case "asc":
                  aggregationPipeline.push({
                    $sort: ascObj,
                  });
                  break;
                case "desc":
                  aggregationPipeline.push({
                    $sort: descObj,
                  });
                  break;
                // default:
                //   aggregationPipeline.push({
                //     $sort: ascObj,
                //   });
              }
            });
          }

          //Grouping
          let currentGroup: string | number | null = null;
          if (args.groupKeys.length > 0) {
            args.groupKeys.forEach((groupKey: any, index: string | number) => {
              let matchObj: any = {};
              matchObj[args.rowGroups[index].field] = groupKey;
              aggregationPipeline.push({
                $match: matchObj,
              });
            });
          }
          if (args.rowGroups.length > args.groupKeys.length) {
            currentGroup = args.rowGroups[args.groupKeys.length].field;
            aggregationPipeline.push({
              $group: {
                _id: `$${currentGroup}`,
              },
            });
          }
          let sortDirection = 1;
          if (args.sortModel?.length > 0)
            sortDirection = [...args.sortModel].pop().sort == "asc" ? 1 : -1;

          aggregationPipeline.push({
            $sort: {
              _id: sortDirection,
            },
          });
          // const startRow = args.startRow ? args.startRow : 0;

          OlympicWinner.aggregate(aggregationPipeline)
            .skip(args.startRow)
            .limit(args.endRow - args.startRow)
            .exec()
            .then((results) => {
              let newResults = results.map((row) => {
                let newRow = { ...row };
                if (currentGroup) newRow[currentGroup] = row._id;
                return newRow;
              });
              let lastRow = undefined;
              let currentLastRow = args.startRow + results.length;
              if (currentLastRow < args.endRow) lastRow = currentLastRow;

              resolve({
                rows: newResults,
                lastRow: lastRow,
              });
            });
          // .exec(function (err, results) {
          //   if (err) return reject(err);
          //   let newResults = results;
          //   newResults = results.map((row) => {
          //     let newRow = { ...row };
          //     if (currentGroup) newRow[currentGroup] = row._id;
          //     return newRow;
          //   });
          //   let lastRow = undefined;
          //   let currentLastRow = args.startRow + results.length;
          //   if (currentLastRow < args.endRow) lastRow = currentLastRow;

          //   console.log(newResults, results);

          //   resolve({
          //     rows: newResults,
          //     lastRow: lastRow,
          //   });
          // });
        });
      },
    },
  },
});
const schema = new GraphQLSchema({
  query: RootQuery,
});
export default schema;
