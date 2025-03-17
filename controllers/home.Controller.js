const fs = require("fs");
const Contact = require("../models/Contact.models");
const ContactCustomField = require("../models/ContactCutsomField.models");
const customFieldModels = require("../models/customFields.models");
const Tag = require("../models/tag");

const processFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read and parse JSON file
    const filePath = req.file.path;
    const rawData = fs.readFileSync(filePath, "utf8");
    fs.unlinkSync(filePath); // Delete file after reading

    let jsonData;
    try {
      jsonData = JSON.parse(rawData);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError.message);
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    // Validate JSON structure
    if (!jsonData.leadsData || !Array.isArray(jsonData.leadsData)) {
      return res.status(400).json({ message: "Invalid JSON structure" });
    }

    // Process JSON in Chunks (1000 at a time)
    const chunkSize = 1000;
    const totalChunks = Math.ceil(jsonData.leadsData.length / chunkSize);
    console.log(`Processing ${totalChunks} chunks of data...`);

    let insertedRecords = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, jsonData.leadsData.length);
      const chunk = jsonData.leadsData.slice(start, end);

      for (const leadData of chunk) {
        if (!leadData.email || !leadData.email.trim()) {
          console.warn(`Skipping entry without email: ${leadData.id}`);
          continue;
        }

        console.log(`Processing lead with ID: ${leadData.id}, Email: ${leadData.email.trim()}`);

        // Prepare contact data
        const contactData = {
          location_id: leadData.locationId || null,
          contact_id: leadData.id || null,
          name: leadData.firstName + " " + leadData.lastName || null,
          email: leadData.email.trim(), // Ensure no spaces
          phone: leadData.phone || null,
          address: leadData.address_1 || null,
          profile_image: leadData.profilePhoto || null,
          city: leadData.city || null,
          state: leadData.state || null,
          country: leadData.country || null,
          company: leadData.companyName || null,
          website: leadData.website || null,
          source: leadData.source || null,
          type: leadData.type || null,
          assigned_to: leadData.assignedTo || null,
          tags: leadData.tags?.join(",") || null,
          followers: leadData.followers ? JSON.stringify(leadData.followers) : null,
          additional_emails: leadData.additionalEmails ? JSON.stringify(leadData.additionalEmails) : null,
          attributions: leadData.attributions ? JSON.stringify(leadData.attributions) : null,
          dnd: leadData.dnd || false,
          dnd_settings_email: leadData.dndSettings?.email || null,
          dnd_settings_sms: leadData.dndSettings?.sms || null,
          dnd_settings_call: leadData.dndSettings?.call || null,
          date_added: leadData.dateAdded ? new Date(leadData.dateAdded) : null,
          date_updated: leadData.dateUpdated ? new Date(leadData.dateUpdated) : null,
          date_of_birth: leadData.dateOfBirth ? new Date(leadData.dateOfBirth) : null,
        };

        try {
          // Insert or update contact
          let contact = await Contact.findOneAndUpdate(
            { contact_id: leadData.id },
            contactData,
            { upsert: true, new: true }
          );

          insertedRecords++;
          console.log(`Contact with ID ${leadData.id} inserted or updated successfully.`);

          if (leadData && leadData.customFields && leadData.customFields.length > 0) {
            for (const field of leadData.customFields) {
              console.log('Processing custom field:', field);

              // Fetch the custom field from the database by cf_id (custom field ID)
              let dbCf = await customFieldModels.findOne({ cf_id: field.id });

              if (!dbCf) {
                console.warn(`Custom Field with ID ${field.id} not found for lead ${leadData.id}`);
                continue;  // Skip if the custom field doesn't exist in the database
              }

              // Determine the field value key based on the type, capitalizing the first letter
              const fieldValueKey = `fieldValue${field.type.charAt(0).toUpperCase() + field.type.slice(1)}`;

              // Check if the key exists on the field object
              if (!(fieldValueKey in field)) {
                console.warn(`No value found for field type ${field.type} in custom field ID ${field.id}`);
                continue; // Skip if the corresponding value is missing
              }

              // Extract the value dynamically using the key
              let value = field[fieldValueKey];

              // Proceed if the value is valid
              if (value !== undefined && value !== null) {
                // Check if a record already exists for this contact and custom field
                const existingRecord = await ContactCustomField.findOne({
                  contact_id: contact._id,
                  custom_field_id: dbCf._id,
                });

                if (existingRecord) {
                  // If record exists, update it
                  existingRecord.value = value;
                  existingRecord.user_id = req.user?.id;  // Update user_id if necessary
                  await existingRecord.save();
                  console.log(`Updated value for custom field ID ${field.id} for lead ${leadData.id}`);
                } else {
                  // If record doesn't exist, create a new one
                  await ContactCustomField.create({
                    contact_id: contact._id,  // Assuming 'contact' object exists and is valid
                    custom_field_id: dbCf._id,
                    value: value,  // Ensure 'value' holds the data you intend to store
                    user_id: req.user?.id,  // Assuming 'req.user' is available and contains the user info
                  });
                  console.log(`Stored value for custom field ID ${field.id} for lead ${leadData.id}`);
                }
              } else {
                console.warn(`Skipping custom field ID ${field.id} for lead ${leadData.id} due to invalid value`);
              }
            }
          } else {
            console.warn('No custom fields available for the lead');
          }




          if (leadData.tags && leadData.tags.length > 0) {
            try {
              // Log the tags array once before the loop starts
          

              for (const tagName of leadData.tags) {

                const trimmedTagName = tagName.trim();
               
                // Check if the tag already exists in the database with the same user_id and location_id
                let tag = await Tag.findOne({
                  name: trimmedTagName,
                  user_id: req.user?.id,
                  location_id: leadData.locationId || null,
                });

                if (!tag) {
                  // If the tag doesn't exist, create a new one
                  tag = await Tag.create({
                    name: trimmedTagName,
                    location_id: leadData.locationId || null,
                    user_id: req.user?.id,
                  });

                  console.log('Created new tag:');
                } else {
                  console.log('Tag already exists:');
                }

                // Add the tag to the contact's tag array
                await Contact.updateOne(
                  { _id: contact._id },
                  { $addToSet: { tags: tag._id } } // Ensure the tag is only added once
                );

                console.log(`Associated tag with contact: ${tag._id}`);
              }
            } catch (error) {
              console.error('Error processing tags:', error);
            }
          }







        } catch (mongoError) {
          console.error(`Error inserting contact ${leadData.id}:`, mongoError.message);
        }
      }
    }

    res.json({
      message: "File processed successfully",
      totalRecords: jsonData.leadsData.length,
      insertedRecords,
    });
  } catch (error) {
    console.error("Error processing file:", error.message);
    res.status(500).json({ message: "File processing failed" });
  }
};

module.exports = { processFile };
