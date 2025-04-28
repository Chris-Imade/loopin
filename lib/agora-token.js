const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

/**
 * Creates an Agora RTC token for video/audio channels
 *
 * @param {string} channelName - The name of the channel to join
 * @param {string} uid - The user ID (can be string or number)
 * @param {string} role - The role: "publisher" or "subscriber"
 * @param {number} expireTimeInSeconds - Seconds until the token expires
 * @returns {string} The generated token
 */
function createAgoraToken(
  channelName,
  uid,
  role = "publisher",
  expireTimeInSeconds = 3600
) {
  if (
    !process.env.NEXT_PUBLIC_AGORA_APP_ID ||
    !process.env.AGORA_APP_CERTIFICATE
  ) {
    throw new Error("Agora credentials not configured properly");
  }

  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  // Get current timestamp in seconds
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Set token expiration time
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

  // Determine role constant
  let roleConstant;
  if (role === "publisher") {
    roleConstant = RtcRole.PUBLISHER;
  } else {
    roleConstant = RtcRole.SUBSCRIBER;
  }

  // Generate the token
  let token;
  if (typeof uid === "string") {
    // For string UIDs (userAccount)
    token = RtcTokenBuilder.buildTokenWithAccount(
      appID,
      appCertificate,
      channelName,
      uid,
      roleConstant,
      privilegeExpiredTs
    );
  } else {
    // For numeric UIDs
    token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      parseInt(uid),
      roleConstant,
      privilegeExpiredTs
    );
  }

  return token;
}

module.exports = {
  createAgoraToken,
};
