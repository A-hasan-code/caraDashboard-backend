const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  location_id: { type: String, default: null },
  contact_id: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  email: { type: String, trim: true, lowercase: true, default: null },
  phone: { type: String, default: null },
  address: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  postal_code: { type: String, default: null },
  country: { type: String, default: null },
  company: { type: String, default: null },
  website: { type: String, default: null },
  source: { type: String, default: null },
  type: { type: String, default: null },
  assigned_to: { type: String, default: null },
  profile_image: { type: String, default: null },
  tags: { type: String },
  followers: { type: Array, default: [] },
  additional_emails: { type: Array, default: [] },
  additional_phones: { type: Array, default: [] },
  attributions: { type: Array, default: [] },
  custom_fields: { type: Array, default: [] },
  dnd: { type: Boolean, default: false },
  dnd_settings_email: { type: Boolean, default: null },
  dnd_settings_sms: { type: Boolean, default: null },
  dnd_settings_call: { type: Boolean, default: null },
  inbound_dnd_settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  date_added: { type: Date, default: null },
  date_updated: { type: Date, default: null },
  date_of_birth: { type: Date, default: null },
  created_by: { type: String, default: null },
  last_updated_by: { type: String, default: null },
  facebook_id: { type: String, default: null },
  instagram_id: { type: String, default: null },
  linkedIn_lead_id: { type: String, default: null },
  facebook_lead_id: { type: String, default: null },
  client_portal_id: { type: String, default: null },
  last_activity: { type: Date, default: null },
  last_conversation_id: { type: String, default: null },
  last_conversation_message_type: { type: Number, default: null },
  conversations: { type: Array, default: [] },
  is_valid_whatsapp: { type: Boolean, default: null },
  qbo_id: { type: String, default: null },
  qbo_sync_token: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Contact", ContactSchema);
