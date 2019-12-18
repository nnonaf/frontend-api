var { keys, omit, get, forEach, split, reduce, map, concat, indexOf, first, isNumber, isString, isArray, isObject } = require('lodash');
var { DocumentQuery, Types } = require('mongoose');

var parseQuery = (data) => {
  // console.log('parse data => ', data);
  forEach(data, (val, key) => {
    if (val && val.match && val.match(/\/.*\/.*/)) {
      // match for regex values
      try {
        eval(val);
        data[key] = eval(val);
      } catch (error) {
      }
    } else if (val && val.match && (val.match(/\{.*\}/) || val.match(/(true|false)/))) {
      // match for object values
      try {
        data[key] = JSON.parse(val);
      } catch (error) {
      }
    }
    // cast string to relevant ObjectId
    let v = data[key];
    if (typeof v === 'string' && Types.ObjectId.isValid(v)) data[key] = Types.ObjectId(v);
  });
  return data;
}

var getSumData = (data, query) => {
  let regex = /(\w{1,})\[(.*)\]/g;
  let match = regex.exec(query);
  if (match && match.length > 1) {
    let parts = split(match[2], ',');
    switch (parts.length) {
      case 1:
        if (regex.test(parts[0])) {
          return getSumData(data, parts[0]);
        }
        return reduce(get(data, match[1]), (prev, curr) => {
          return prev + get(curr, parts[0], 0);
        }, 0);
      case 3:
        return reduce(get(data, match[1]), (prev, curr) => {
          if (get(curr, parts[0]) == parts[1]) {
            return prev + get(curr, parts[2], 0);
          }
          return prev;
        }, 0);
      default:
        return 0;
    }
  }
  return get(data, query, 0);
}

var filterArray = (data, condition, props, others) => {
  return map(data, (d) => filterProperties(d, condition, props, others));
}

var filterObject = (data, condition, props, others) => {
  if (condition(data)) {
    forEach(data, (val, key) => {
      if (indexOf(props, key) >= 0) {        
        delete data[key];
        return;
      }
      data[key] = filterProperties(val, condition, props, others);
    });
  } else {
    forEach(data, (val, key) => {
      if (indexOf(others, key) >= 0) {        
        delete data[key];
        return;
      }
      data[key] = filterProperties(val, condition, props, others);
    });
  }
  return data;
}

var filterProperties = (data, condition, props, others) => {
  if (!data) {
    return data;
  }

  if (isNumber(data)) {
    return data;
  }

  if (isString(data)) {
    return data;
  }

  if (isArray(data)) {
    return filterArray(data, condition, props, others);
  }

  if (isObject(data)) {
    return filterObject(data, condition, props, others);
  }

  return data;
}

module.exports = {
  parseQuery,
  generateSearchQuery: (model, cond) => new Promise((resolve, reject) => {
    let data = omit(cond, '_sort', '_skip', '_limit', '_count', '_sum', '_populate', '_or', '_and');
    data = parseQuery(data);
    /**
     * @type {DocumentQuery}
     */
    let search = model.find(data);
    if (cond._or) {
      let or = JSON.parse(cond._or);
      forEach(or, (val, key) => {
        or[key] = parseQuery(val);
      });
      search.or(or);
    }
    if (cond._and) {
      let and = JSON.parse(cond._and);
      forEach(and, (val, key) => {
        and[key] = parseQuery(val);
      });
      search.and(and)
    }
    if (cond._sort) {
      let sort = {};
      try {
        let sortString = cond._sort.split(',');
        forEach(sortString, (s) => {
          let split = s.split(':');
          sort[split[0]] = split[1];
        })
      } catch (error) { }
      search.sort(sort);
    }
    if (cond._skip) {
      search.skip(Number.parseInt(cond._skip));
    }
    if (cond._limit && Number.parseInt(cond._limit) <= 500) {
      search.limit(Number.parseInt(cond._limit));
    } else {
      search.limit(500);
    }
    if (cond._count) {
      search.count((err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    } else if (cond._sum) {
      search.exec((err, list) => {
        if (err) reject(err);
        else resolve(list.reduce((prev, curr) => {
          return prev + Number(getSumData(curr, cond._sum));
        }, 0));
      });
    } else {
      if (cond._populate) {
        try {
          let split = cond._populate.split(',');
          for (var i = 0; i < split.length; i++) {
            search.populate(split[i]);
          }
        } catch (error) { }
      }
      search.exec((err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    }
  }),
  filterProperties: (data, condition, props = ['password', 'isAdmin', 'documents'], others = ['password']) => {
    try {
      if (data._doc) {
        data = data._doc;
      }
      else if (first(data) && first(data)._doc) {
        data = map(data, (d) => d._doc);
      }
      return filterProperties(JSON.parse(JSON.stringify(data)), condition, props, others);
    } catch (error) {
      console.log(error);
      return data;
    }
  }
}