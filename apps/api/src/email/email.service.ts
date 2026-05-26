import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import {
  htmlConfirmacionCita,
  htmlRecordatorioCita,
} from './templates/confirmacion-cita.html'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private resend: Resend | null = null
  private from: string

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')
    this.from = this.config.get<string>('EMAIL_FROM', 'Kings Auto Diagnósticos <noreply@kingsauto.hn>')

    if (apiKey) {
      this.resend = new Resend(apiKey)
      this.logger.log('Resend configurado correctamente')
    } else {
      this.logger.warn('RESEND_API_KEY no configurada — los emails no se enviarán')
    }
  }

  async sendConfirmacionCita(data: {
    to: string
    nombre: string
    fecha: string
    hora: string
    marca: string
    modelo: string
    anio: number
    placa: string
    telefonoTaller: string
  }): Promise<void> {
    if (!this.resend) return

    const html = htmlConfirmacionCita({
      nombre: data.nombre,
      fecha: data.fecha,
      hora: data.hora,
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio,
      placa: data.placa,
      telefono: data.telefonoTaller,
    })

    try {
      await this.resend.emails.send({
        from: this.from,
        to: data.to,
        subject: `✅ Cita confirmada — ${data.fecha} a las ${data.hora}`,
        html,
      })
      this.logger.log(`Email de confirmación enviado a ${data.to}`)
    } catch (err) {
      this.logger.error(`Error enviando email a ${data.to}`, err)
    }
  }

  async sendRecordatorioCita(data: {
    to: string
    nombre: string
    fecha: string
    hora: string
    marca: string
    modelo: string
    anio: number
    placa: string
    telefonoTaller: string
  }): Promise<void> {
    if (!this.resend) return

    const html = htmlRecordatorioCita({
      nombre: data.nombre,
      fecha: data.fecha,
      hora: data.hora,
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio,
      placa: data.placa,
      telefono: data.telefonoTaller,
    })

    try {
      await this.resend.emails.send({
        from: this.from,
        to: data.to,
        subject: `⏰ Recordatorio — Tu cita es mañana a las ${data.hora}`,
        html,
      })
      this.logger.log(`Recordatorio enviado a ${data.to}`)
    } catch (err) {
      this.logger.error(`Error enviando recordatorio a ${data.to}`, err)
    }
  }
}
