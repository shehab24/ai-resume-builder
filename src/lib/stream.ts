import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

if (!apiKey || !apiSecret) {
    throw new Error('Stream API credentials are missing');
}

// Initialize Stream client
const streamClient = new StreamClient(apiKey, apiSecret);

/**
 * Generate a Stream Video token for a user
 * @param userId - Unique user ID (use Clerk ID or database ID)
 * @param userName - User's display name
 * @returns Stream token for authentication
 */
export async function generateStreamToken(userId: string, userName: string) {
    try {
        // Subtract 60 seconds to account for clock skew
        const issuedAt = Math.floor(Date.now() / 1000) - 60;
        const token = streamClient.createToken(userId, issuedAt + 24 * 60 * 60, issuedAt);
        return token;
    } catch (error) {
        console.error('Error generating Stream token:', error);
        throw new Error('Failed to generate video token');
    }
}

/**
 * Create a video call
 * @param callId - Unique call ID
 * @param createdBy - User ID of the creator
 * @returns Call details
 */
export async function createVideoCall(callId: string, createdBy: string) {
    try {
        const call = streamClient.video.call('default', callId);
        await call.getOrCreate({
            data: {
                created_by_id: createdBy,
                settings_override: {
                    audio: {
                        mic_default_on: true,
                        default_device: "speaker" // Required field
                    },
                    video: {
                        camera_default_on: true,
                        target_resolution: {
                            width: 1280,
                            height: 720,
                            bitrate: 1500000
                        }
                    },
                    screensharing: { enabled: true },
                    recording: {
                        mode: 'available',
                        quality: '720p',
                        audio_only: false
                    },
                },
            },
        });
        return call;
    } catch (error) {
        console.error('Error creating video call:', error);
        throw new Error('Failed to create video call');
    }
}

export { streamClient };
export const STREAM_API_KEY = apiKey;
