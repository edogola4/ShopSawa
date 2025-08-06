// backend/src/utils/apiFeatures.js

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle category filter separately
    let categoryFilter = {};
    if (this.queryString.category) {
      const mongoose = require('mongoose');
      const categoryIds = Array.isArray(this.queryString.category)
        ? this.queryString.category.map(id => new mongoose.Types.ObjectId(id))
        : [new mongoose.Types.ObjectId(this.queryString.category)];
      
      categoryFilter = { category: { $in: categoryIds } };
    }

    // Advanced filtering for other fields
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    
    // Parse the query and combine with category filter
    const query = JSON.parse(queryStr);
    
    // Ensure we only show active products by default
    if (!query.status) {
      query.status = 'active';
    }

    // Combine all filters
    const finalQuery = { ...query, ...categoryFilter };
    
    console.log('🔍 Filtering products with query:', JSON.stringify(finalQuery, null, 2));
    this.query = this.query.find(finalQuery);
    return this;
  }

  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search }
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;