"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Image as ImageIcon, Upload, Trash2, Download, Eye, Folder, Plus, X } from "lucide-react"

export default function FotografiasPage() {
  const [albums] = useState<any[]>([])

  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-500" />
            Sistema de Fotos & Gerenciador de Mídia
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organização em árvore: Cliente → Evento → Álbum → Fotografias.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {albums.map((alb, i) => (
          <div key={i} className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md space-y-4">
            <div className="flex items-center gap-2 text-xs text-pink-600 font-bold">
              <Folder className="w-4 h-4" />
              <span>{alb.client} • {alb.event} • <strong className="text-slate-900 dark:text-white">{alb.album}</strong></span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {alb.photos?.map((photo: any) => (
                <div
                  key={photo.id}
                  onClick={() => setFullscreenPhoto(photo.url)}
                  className="group relative h-40 rounded-2xl overflow-hidden border border-[var(--border-soft)] cursor-pointer card-3d"
                >
                  <Image src={photo.url} alt={photo.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                    <span className="font-bold">{photo.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {fullscreenPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-[80vh] rounded-2xl overflow-hidden">
            <Image src={fullscreenPhoto} alt="Full view" fill className="object-contain" />
            <button onClick={() => setFullscreenPhoto(null)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}