require('colors')
const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')

let FILTER = false
let SCOPES = ['https://mail.google.com/'] // get full access, including permanent delete
let TOKEN_PATH = './token.json' // Automatic create token after auth succesfull
let QUERY = {
    userId: 'me',
    q: FILTER,
    maxResults: 500
}

// query slicing
const args = process.argv.slice(2) // remove "node" and "index.js"
if (!args.length) {
    console.error('[ ERROR ] '.red + 'Query is required')
    process.exit(1)
} else {
    const query = args[0].split('=')
    if (!query.length) {
        console.error('[ ERROR ] '.red + 'Invalid query')
        process.exit(1)
    } else {
        FILTER = query[1];
    }
}


if (FILTER) {
    // load client from local
    fs.readFile('credentials.json', (e, res) => {
        if (e) {
            console.error('[ ERROR ] '.red + 'Error while loading credentials.json')
            console.error('[ ERROR ] '.red + e.message)
            process.exit(1)
        }

        authorize(JSON.parse(res), deleteEmail)
    })
}


/**
 * 
 * Create an OAuth2 client with the given credentials,
 * then execute the given callback function.
 * @param {Object} credentials authorization client credentials.
 * @param {function} callback  callback for authorized client.
 */
function authorize(credentials, callback) {
    const {
        client_id,
        client_secret,
        redirect_uris,
    } = credentials.web

    if (!redirect_uris || !client_id || !client_secret) {
        console.error('[ ERROR ] '.red + 'Invalid credentials content')
        process.exit(1)
    }

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);

        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {function} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    })

    console.info('[ INFO ] '.blue + 'Visit this url to authorize this app: ')
    console.info('[ INFO ] '.blue + authUrl.green)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // reading user input
    rl.question('[ INPUT ] '.green + 'Enter code from that page here: ', (code) => {
        rl.close();

        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('[ ERROR ] '.red + 'Error while retriving access token')
                console.error('[ ERROR ] '.red + err.message)
                process.exit(1)
            }

            // save the token
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    console.error('[ WARN ]'.yellow + `Failed to save token`);
                };

                console.info('[ INFO ] '.blue + `Token saved to ${TOKEN_PATH}`);
            })

            callback(oAuth2Client);
        });
    });
}


/**
 * @param {google.gmail} gmail google gmail app
 * @param {json} query the filter
 * @param {json} requestBody can't be empty just fill with {} if necessary
 * @param {function} callback function to execute
 */

function findEmails(gmail, query, requestBody, callback) {
    gmail.users.messages.list(query, (err, res) => {
        if (err) {
            console.error('[ ERROR ] '.red + err.message)
            process.exit(1)
        }

        const messages = res.data.messages;

        let id = [];

        if (messages && messages.length) {
            messages.forEach(msg => {
                id.push(msg.id);
                console.info('[ INFO ]'.blue + 'Found email with id' + `${msg.id}`.green)
            });

            const ids = { ids: id }
            let batchhRequestBody = Object.assign(ids, requestBody)

            console.log(batchhRequestBody)

            callback(batchhRequestBody);

            if (res.data.nextPageToken) {
                searchQuery.pageToken = res.data.nextPageToken;
                findEmails(searchQuery);
            }
        } else {
            console.info('[ INFO ] '.blue + 'No (more) emails found')
        }
    })
}

/**
 * Delete email by given filter
 * @param {google.auth.OAuth2} auth authorization from user
 */
function deleteEmail(auth) {
    const gmail = google.gmail({
        version: 'v1',
        auth
    })

    const bulkDelete = (request) => {
        gmail.users.messages.batchDelete({
            userId: 'me',
            resource: request
        }, (err, res) => {
            if (err) {
                console.error('[ ERROR ] '.red + 'Something went wrong with API')
                console.error('[ ERROR ] '.red + err.message)
                process.exit(1);
            }

            if (res.status === 204) {
                console.log('[ INFO ] '.green + `${request.ids.length}`.red + `emails Permanently deleted`)
            }
        });
    }

    findEmails(gmail, QUERY, {}, bulkDelete)
}

function trashEmails(auth) {
    const gmail = google.gmail({
        version: 'v1',
        auth
    })

    const bulkTrash = (requestBody) => {
        gmail.users.messages.batchModify({
            userId: 'me',
            resource: requestBody
        }, (err, res) => {
            if (err) {
                console.error('[ ERROR ] '.red + 'Something went wrong with API')
                console.error('[ ERROR ] '.red + err.message)
                process.exit(1);
            }

            if (res.status === 204) {
                console.log('[ INFO ] '.green + `${request.ids.length} emails moved to trash`)
            }
        })
    }

    findEmails(gmail, QUERY, { addLabelIds: ['TRASH'] }, bulkTrash)
}

module.exports = {
    SCOPES,
    deleteEmail,
    trashEmails
};