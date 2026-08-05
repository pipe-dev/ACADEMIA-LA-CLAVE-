import { MidiImporter } from "@/components/admin/midi-importer";

export default function AdminMidiPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Importador de MIDI 🎹</h1>
          <p className="text-slate-400">
            Arrastra tus archivos .mid para extraer la melodía vocal y guardarla masivamente en la base de datos de AfinApp.
          </p>
        </div>
        
        <MidiImporter />
      </div>
    </div>
  );
}
