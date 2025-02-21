import React, { useState, useEffect } from "react";
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import TransgenderIcon from '@mui/icons-material/Transgender';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import WorkIcon from '@mui/icons-material/Work';
import { Patient, Diagnosis, Entry, EntryWithoutId } from "../../types";
import HealthRatingBar from "../HealthRatingBar";

import { useParams } from "react-router-dom";
import patientService from "../../services/patients";
import diagnosisService from "../../services/diagnoses";
import AddEntryModal from "../AddEntryModal";
import { Button } from '@mui/material';
import axios from "axios";

const assertNever = (value: never): never => {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
};

const EntryDetails: React.FC<{ entry: Entry }> = ({ entry }) => {
  switch (entry.type) {
    case "Hospital":
      return <HospitalEntry entry={entry} />;
    case "OccupationalHealthcare":
      return <OccupationalHealthcareEntry entry={entry} />;
    case "HealthCheck":
      return <HealthCheckEntry entry={entry} />;
    default:
      return assertNever(entry);
  }
};

const HospitalEntry: React.FC<{ entry: Entry }> = ({ entry }) => {
  if (entry.type !== "Hospital") return null;
  return (
    <div style={{ border: '1px solid rgba(0, 0, 0, 1)' }}>
      <div>{entry.date} <LocalHospitalIcon /> </div>
      <i>{entry.description}</i>
      {entry.diagnosisCodes ? <DiagnosisDetails entry={entry} /> : null}
      <div style={{ paddingLeft: 15 }}>Discharge date: {entry.discharge.date}</div>
      <div style={{ paddingLeft: 15 }}>Criteria for discharge: {entry.discharge.criteria}</div>
      <div>Diagnosed by {entry.specialist}</div>
    </div>
  );
};

const OccupationalHealthcareEntry: React.FC<{ entry: Entry }> = ({ entry }) => {
  if (entry.type !== "OccupationalHealthcare") return null;
  return (
    <div style={{ border: '1px solid rgba(0, 0, 0, 1)' }}>
      <div>{entry.date} <WorkIcon /> <i>{entry.employerName}</i></div>
      <i>{entry.description}</i>
      {entry.diagnosisCodes ? <DiagnosisDetails entry={entry} /> : null}
      {entry.sickLeave?.startDate ? <div> Sick leave: {entry.sickLeave.startDate} - {entry.sickLeave.endDate}</div> : null}
      <div>Diagnosed by {entry.specialist}</div>
    </div>
  );
};

const HealthCheckEntry: React.FC<{ entry: Entry }> = ({ entry }) => {
  if (entry.type !== "HealthCheck") return null;
  return (
    <div style={{ border: '1px solid rgba(0, 0, 0, 1)' }}>
      <div>{entry.date} <MedicalInformationIcon /></div>
      <i>{entry.description}</i>
      {entry.diagnosisCodes ? <DiagnosisDetails entry={entry} /> : null}
      <HealthRatingBar showText={false} rating={entry.healthCheckRating} />
      <div>Diagnosed by {entry.specialist}</div>
    </div>
  );
};

const getDiagnosisName = (d: string, diagnoses: Diagnosis[] | undefined) => {
  const diagnosis = diagnoses?.find(({ code }) => code === d);
  return diagnosis?.name;
};

const DiagnosisDetails: React.FC<{ entry: Entry }> = ({ entry }) => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>();

  useEffect(() => {
    const fetchDiagnoses = async () => {
      const diagnoses = await diagnosisService.getAll();
      setDiagnoses(diagnoses);
    };
    void fetchDiagnoses();
  }, []);

  return (
    <>
      <p>Diagnosed with:</p>
      <ul>
        {entry.diagnosisCodes?.map(d => (
          <li key={d}>{d}: {getDiagnosisName(d, diagnoses)}</li>
        ))}
      </ul>
    </>
  );
};

const PatientPage = () => {

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const openModal = (): void => setModalOpen(true);

  const closeModal = (): void => {
    setModalOpen(false);
    setError(undefined);
  };

  const id = useParams().id as string;
  const [patient, setPatient] = useState<Patient>();
  let icon = <MaleIcon />;
  const [refetchPatient, setRefetchPatient] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      const patient = await patientService.getPatient(id);
      setPatient(patient);
      setRefetchPatient(false);
    };
    void fetchPatient();
  }, [id, refetchPatient]);

  if (!patient) return <div>No patient found!</div>;

  switch (patient.gender) {
    case 'female':
      icon = <FemaleIcon />;
      break;
    case 'other':
      icon = <TransgenderIcon />;
      break;
    default:
      icon = <MaleIcon />;
  }

  const submitNewEntry = async (values: EntryWithoutId) => {
    try {
      const entry = await patientService.createEntry(id, values);
      setRefetchPatient(true);
      patient.entries.concat(entry);
      setModalOpen(false);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        console.log("ERROR IS", e);
        if (e?.response?.data && typeof e?.response?.data === "string") {
          const message = e.response.data.replace('Something went wrong. Error: ', '');
          console.error(message);
          setError(message);
        } else if (e?.response?.data.error && typeof e?.response?.data.error === "object") {
          const error = e.response.data.error;
          if (Array.isArray(error)) {
            const message: string[] = [];
            for (let i = 0; i < error.length; i++) {
              message.push(error[i].message);
            }
            console.log(message);
            setError(message.toString());
          }
        } else {
          setError("Unrecognized axios error");
        }
      } else {
        console.error("Unknown error", e);
        setError("Unknown error");
      }
    }
  };

  return (
    <div>
      <h2>{patient.name} {icon}</h2>
      <div>SSN: {patient.ssn ? patient.ssn : "unknown"}</div>
      <div>Occupation: {patient.occupation}</div>
      <div>DOB: {patient.dateOfBirth ? patient.dateOfBirth : "unknown"}</div>
      <div style={{ paddingTop: 10 }}>
        <AddEntryModal
          modalOpen={modalOpen}
          onSubmit={submitNewEntry}
          error={error}
          onClose={closeModal}
        />
        <Button variant="contained" onClick={() => openModal()}>
          Add New Entry
        </Button>
      </div>
      {patient.entries.length > 0 ? <h3>Entries</h3> : null}
      {patient.entries.map(e => (
        <div key={e.id} style={{ padding: 4 }}>
          <EntryDetails entry={e} />
        </div>
      ))}
    </div>
  );
};

export default PatientPage;
