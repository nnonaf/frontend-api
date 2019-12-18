module.exports = (Schema) => {
  return new Schema({
    subject: { type: String, required: true },
    sender: { type: String },
    destination: { type: String, required: true },
    body: { type: String, required: true },
    sent: { type: Boolean, default: false },
    delivery_status: { type: String },
    messageId: { type: String }
  }, { timestamps: true });
}