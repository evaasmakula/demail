# Bulk delete Gmail messages

Another ways to delete all of your gmail messages, using Google Gmail API.

## how to use?

- Clone this repo and install using `yarn`, `npm` or `pnpm`
- go to [Google API Library](https://console.cloud.google.com/apis/library) and enable "Gmail API"
- after that click Create credentials chose User data then click next
- fill in all the required parts
- on scopes you can skip it
- on OAuth Client ID chose "web application" and redirect uri https://developers.google.com/oauthplayground
- now download your credentials then move it to the repository you cloned and rename to `credentials.json`
- open terminal and type `node . --q="older_than: 1h"

## Example queries:
|Query|description|example|
|:---:|:---:|:---:|
|`from:`|Specify the sender|`from:notifications@facebookmail.com`|
|`to:`|Specify Recipient|`to:example@gmails.com`|
|`cc:`|Specify a recipient who received a copy|`cc:david`|
|`subject:`|Words in the subject line|`subject:camping`|
|`OR` or `{ }`|Messages that match multiple terms|`from:amy OR from:david` `{from:amy from:david}`|
|`label:`|Messages that have a certain label|`label:friends`|
|`has:`|Messages that have something|`has:attachment`|
|`is:`|Specify mail by state|`is:unread`, `is:starred`|

Here's a complete list of available Gmail search operators: https://support.google.com/mail/answer/7190?hl=en

## PS
the gmail website already has a feature to delete all messages by checking the option, this application is only part of my experiment in using the google API.
