import { Schema, model, Types, type InferSchemaType } from 'mongoose';

// ---------- Movie ----------
const MovieSchema = new Schema(
  {
    title:       { type: String, required: true, index: 'text' },
    genres:      { type: [String], default: [], index: true },
    durationMin: { type: Number, required: true, min: 1 },
    rating:      { type: Number, min: 0, max: 10, default: 0 },
    cast:        { type: [String], default: [] },
    posterUrl:   { type: String },
    trailerUrl:  { type: String },
    description: { type: String },
    releaseDate: { type: Date, index: true },
    languages:   { type: [String], default: [] },
    status:      {
      type: String,
      enum: ['upcoming', 'now_showing', 'archived'],
      default: 'now_showing',
      index: true,
    },
  },
  { timestamps: true, collection: 'movies' },
);

MovieSchema.index({ title: 'text', cast: 'text' });

export type Movie = InferSchemaType<typeof MovieSchema> & { _id: Types.ObjectId };
export const MovieModel = model('Movie', MovieSchema);

// ---------- Showtime ----------
const SeatSchema = new Schema(
  {
    id:    { type: String, required: true },
    type:  { type: String, enum: ['STD', 'PRM', 'VIP'], default: 'STD' },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const SeatRowSchema = new Schema(
  {
    row:   { type: String, required: true },
    seats: { type: [SeatSchema], required: true },
  },
  { _id: false },
);

const ShowtimeSchema = new Schema(
  {
    movieId:   { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    theaterId: { type: Schema.Types.ObjectId, required: true, index: true },
    screenId:  { type: String, required: true },
    startsAt:  { type: Date, required: true, index: true },
    endsAt:    { type: Date },
    basePrice: { type: Number, required: true, min: 0 },
    currency:  { type: String, default: 'USD' },
    language:  { type: String },
    format:    { type: String, enum: ['2D', '3D', 'IMAX', '4DX'], default: '2D' },
    seatMap:   { type: [SeatRowSchema], required: true },
    soldCount: { type: Number, default: 0 },
    capacity:  { type: Number, required: true, min: 1 },
    version:   { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'showtimes' },
);

ShowtimeSchema.index({ movieId: 1, startsAt: 1 });
ShowtimeSchema.index({ theaterId: 1, startsAt: 1 });

export type Showtime = InferSchemaType<typeof ShowtimeSchema> & { _id: Types.ObjectId };
export const ShowtimeModel = model('Showtime', ShowtimeSchema);
