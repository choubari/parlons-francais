import type { Exercise } from "./types";
import entretien from "./entretien";
import travail from "./travail";
import sante from "./sante";
import prefecture from "./prefecture";
import quotidien from "./quotidien";

// The built-in French practice situations shipped in the repo. Used to seed the
// database on first boot (attributed to the admin user).
export const BUILTIN_EXERCISES: Exercise[] = [
  entretien,
  travail,
  sante,
  prefecture,
  quotidien,
].flat();
