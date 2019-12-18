module.exports = (Schema) => {
  let schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true },
    location: { type: String },
    activityId: { type: String },
    userAgent: { type: Schema.Types.Mixed },
    description: { type: String, required: true }
  }, { timestamps: true });

  return schema;
}