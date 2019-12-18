module.exports = (Schema) => {
  var DocumentSchema = new Schema({
    type: { type: String, required: true },
    thumb: { type: String, required: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });

  let schema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['M', 'F'] },
    country: { type: String },
    role: { type: Number, default: 3, enum: [1, 2, 3] },
    disabled: { type: Boolean, default: false },
    referer: { type: Schema.Types.ObjectId, ref: 'User' },
    contact: {
      address: { type: String },
      phone: { type: String },
      socialMedia: [{ name: String, url: String }]
    },
    emailVerified: { type: Boolean, default: false },
    merchantVerified: { type: Boolean, default: false },
    documents: [DocumentSchema],
    avatar: {
      thumb: { type: String },
      url: { type: String }
    }
  }, { timestamps: true });

  schema.virtual('isAdmin').get(function () {
    return this.role === 1;
  });

  schema.path('email').validate(function (email) {
    var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailRegex.test(email); // Assuming email has a text attribute
  }, 'The e-mail field cannot be empty.');

  return schema;
}
