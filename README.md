# Kitchen Board

A full-screen page for the kitchen TV. News and upcoming events rotate on a timer. A side panel shows the clock, the date, the week number and the next five events.

## Put it on GitHub Pages

1. Create a new repository on github.com, for example `kitchen-board`. It must be **public**, unless your company has a paid GitHub plan.
2. Upload everything to it: `index.html`, `style.css`, `app.js`, `qrcode.js`, `items.json` and the `images` folder. Unzip `kitchen-board.zip` first, then drag all of its contents into GitHub's "upload files" page.
3. Go to **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**, then pick `main` and `/ (root)`. Save.
4. After a minute the page is live at `https://<your-username>.github.io/kitchen-board/`.

## Show it on the Samsung TV

1. Open the **Internet** app on the TV. It's under Apps if it isn't on the home bar.
2. Go to the address above and bookmark it.
3. Press the full-screen option in the browser's menu, or move the pointer and click **Full screen** in the bottom right corner.
4. Turn off the TV's screen saver and auto power-off, under Settings → General → Power and Energy Saving / System Manager. Otherwise the TV may switch off after a few hours.

The board checks `items.json` for changes every 2 minutes. It reloads itself completely every 6 hours, so you never need to touch the TV.

## Change the news and events

Open `items.json` on github.com, click the pencil icon, edit, and press **Commit changes**. The TV shows the change within a few minutes.

Each item looks like this:

```json
{
  "type": "event",
  "title": "Fika Friday",
  "text": "Cinnamon buns and coffee for everyone.",
  "date": "2026-11-06",
  "time": "15:00",
  "place": "Big kitchen"
}
```

| Field | Needed | What it does |
|---|---|---|
| `type` | yes | `"event"` or `"news"` |
| `title` | yes | The big headline |
| `text` | no | A sentence or two below the headline |
| `date` | events | `YYYY-MM-DD`. The event disappears the day after this date. |
| `time` | no | Shown as written, e.g. `"15:00"` |
| `place` | no | Where it happens |
| `showUntil` | no | `YYYY-MM-DD`. Hides news after this date. Without it, news stays until you delete it. |
| `image` | no | A picture shown beside the text. Use a file in the `images` folder, e.g. `"images/fika.jpg"`, or a full `https://` address. |
| `imageAlt` | no | A short description of the picture |
| `qr` | no | A link to turn into a QR code, e.g. your Microsoft Forms or Google Forms sign-up link |
| `qrLabel` | no | The text under the QR code. Defaults to "Scan to sign up". |

### Adding a picture

1. In the repository, open the `images` folder and choose **Add file → Upload files**.
2. Upload the picture and commit.
3. In `items.json`, add `"image": "images/your-file-name.jpg"` to the item.

Portrait or square pictures fit best. Keep them under about 1 MB so the TV loads them quickly. A phone photo can be shrunk at squoosh.app.

An item with both a picture and a QR code looks like this:

```json
{
  "type": "event",
  "title": "Julbord",
  "text": "The Christmas dinner. Sign up by 1 December.",
  "date": "2026-12-11",
  "time": "18:00",
  "place": "Restaurant Nord",
  "image": "images/julbord.jpg",
  "qr": "https://forms.office.com/your-form-link",
  "qrLabel": "Scan to sign up"
}
```

At the top of the file, `seconds` sets how long each slide stays up, and `boardName` sets the label in the corner.

**Watch the commas.** Put a comma between items but not after the last one. If the file has a mistake, the TV keeps showing the last version that worked. You can paste the file into jsonlint.com to check it.
