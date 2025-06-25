To use your own voice recordings as reference sounds, place your audio files in this directory.

The application will load a specific audio file for each note based on the selected voice type. Please name your files according to the following convention:

**Convention:** `[voice_type]_[note_name].mp3`

- **[voice_type]:** `masculino` or `femenino`
- **[note_name]:** The note's name and octave. For sharp notes (like C#), replace the '#' symbol with an 's'.

**Examples:**
- For a male C4 note: `masculino_C4.mp3`
- For a female A#3 note: `femenino_As3.mp3`
- For a male G2 note: `masculino_G2.mp3`

You only need to provide the files for the notes that appear in the vocal exercises. If a specific audio file is not found, the application will automatically fall back to a generated triangle wave tone for that note.
