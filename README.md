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

### Background picture

Put a picture in the `images` folder and add `background` at the top of `items.json`, next to `boardName`:

```json
{
  "boardName": "Kitchen board",
  "seconds": 12,
  "background": "images/background.jpg",
  "backgroundDim": 0.6,
  "items": [ ... ]
}
```

`backgroundDim` controls how much the picture is darkened so the text stays readable. Use `0` for no darkening and `0.9` for almost black. The default is `0.6`. Busy or bright photos need more, around `0.7`.

A single slide can have its own background too. Add `"background": "images/julbord.jpg"` to that item, and optionally its own `"backgroundDim"`. The board fades between pictures as the slides change.

Landscape pictures at 1920 × 1080 work best. Keep them under about 1 MB so the TV loads them quickly. If the picture can't be loaded, the board falls back to the plain green background.

### Weekly and monthly events

Add `"repeat"` to an event and leave out `date`. The board works out the next date by itself. It shows that date on the slide and in "Coming up", and moves on to the following date one hour after the start time.

```json
{ "type": "event", "title": "Journal Club", "repeat": "weekly", "day": "Wednesday", "time": "14:00", "place": "Green room" }
```

| Rule | Write it like this |
|---|---|
| Every Tuesday | `"repeat": "weekly", "day": "Tuesday"` |
| Mondays and Thursdays | `"repeat": "weekly", "day": ["Monday", "Thursday"]` |
| Every other Friday | `"repeat": "weekly", "every": 2, "day": "Friday", "date": "2026-11-06"` (the date is one of the Fridays it happens) |
| First Friday of the month | `"repeat": "monthly", "week": "first", "day": "Friday"` |
| Last Thursday of the month | `"repeat": "monthly", "week": "last", "day": "Thursday"` |
| The 15th of every month | `"repeat": "monthly", "dayOfMonth": 15` |

Days can be written in full or short (`"Tue"`). `week` can be `first`, `second`, `third`, `fourth` or `last`.

Optional extras for repeating events:

| Field | What it does |
|---|---|
| `date` | Start date. Nothing shows before it. Required for `"every": 2` and up. |
| `until` | `YYYY-MM-DD`. Last possible date, e.g. the end of term. |
| `skip` | Dates when it's cancelled, e.g. `["2026-12-22", "2026-12-29"]` over Christmas. |

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